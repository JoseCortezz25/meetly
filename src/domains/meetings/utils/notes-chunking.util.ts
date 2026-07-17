import type { TranscriptTurn } from '../types/meeting-detail.types';

/**
 * Conservative chars-per-token ratio for on-device models. Real tokenizers
 * average ~4 chars/token for English prose; using 4 with `Math.ceil` slightly
 * overestimates token counts, which keeps chunks safely under the window.
 */
const CHARS_PER_TOKEN = 4;

/** Context window of every configured notes model (q4f16_1-MLC prebuilds). */
export const NOTES_CONTEXT_WINDOW_TOKENS = 4096;

/**
 * Token budget for the transcript (or partial notes) part of a prompt. The
 * 4096-token context window must also hold the system prompt (~350 tokens),
 * chat-template overhead, and headroom for the generated notes (~1000 tokens),
 * so the input is capped well below the full window.
 */
export const NOTES_INPUT_BUDGET_TOKENS = 2700;

/** Conservative token estimate for a piece of prompt text (never underestimates much). */
export const estimateTokens = (text: string): number =>
  Math.ceil(text.length / CHARS_PER_TOKEN);

/** Formats one transcript turn as a prompt line, e.g. "[01:40] We agreed…". */
export const formatTranscriptTurn = (turn: TranscriptTurn): string =>
  `[${turn.time}] ${turn.text}`;

/** Tokens a turn occupies inside a prompt (formatted line + newline separator). */
const turnTokens = (turn: TranscriptTurn): number =>
  estimateTokens(formatTranscriptTurn(turn)) + 1;

/** Hard-splits a single sentence that alone exceeds the budget (rare fallback). */
const splitByLength = (sentence: string, maxChars: number): string[] => {
  if (sentence.length <= maxChars) return [sentence];
  const pieces: string[] = [];
  for (let start = 0; start < sentence.length; start += maxChars) {
    pieces.push(sentence.slice(start, start + maxChars));
  }
  return pieces;
};

/**
 * Splits one oversized turn into synthetic sub-turns, packing whole sentences
 * greedily so each sub-turn's formatted line stays within the budget.
 */
const splitTurnBySentences = (
  turn: TranscriptTurn,
  budgetTokens: number
): TranscriptTurn[] => {
  // Budget for the raw text, leaving room for the "[time] " prefix.
  const maxChars = Math.max(
    CHARS_PER_TOKEN,
    budgetTokens * CHARS_PER_TOKEN -
      formatTranscriptTurn({ ...turn, text: '' }).length
  );
  const sentences = turn.text
    .split(/(?<=[.!?…])\s+/)
    .flatMap(sentence => splitByLength(sentence, maxChars));

  const parts: string[] = [];
  let buffer = '';
  for (const sentence of sentences) {
    const candidate = buffer.length === 0 ? sentence : `${buffer} ${sentence}`;
    if (buffer.length > 0 && candidate.length > maxChars) {
      parts.push(buffer);
      buffer = sentence;
    } else {
      buffer = candidate;
    }
  }
  if (buffer.length > 0) parts.push(buffer);

  return parts.map((text, index) => ({
    ...turn,
    id: `${turn.id}-part-${index + 1}`,
    text
  }));
};

/**
 * Splits a transcript into chunks that each fit `budgetTokens`, always cutting
 * on turn boundaries. A single turn larger than the whole budget (no boundary
 * to cut on) is split by sentences into synthetic sub-turns instead.
 */
export const chunkTranscriptTurns = (
  transcript: TranscriptTurn[],
  budgetTokens: number
): TranscriptTurn[][] => {
  const chunks: TranscriptTurn[][] = [];
  let current: TranscriptTurn[] = [];
  let currentTokens = 0;

  const flushCurrent = () => {
    if (current.length === 0) return;
    chunks.push(current);
    current = [];
    currentTokens = 0;
  };

  for (const turn of transcript) {
    const tokens = turnTokens(turn);
    if (tokens > budgetTokens) {
      // Oversized turn: close the running chunk and emit each part on its own,
      // since every part is already near the budget.
      flushCurrent();
      for (const part of splitTurnBySentences(turn, budgetTokens)) {
        chunks.push([part]);
      }
      continue;
    }
    if (currentTokens + tokens > budgetTokens) flushCurrent();
    current.push(turn);
    currentTokens += tokens;
  }
  flushCurrent();

  return chunks;
};

/**
 * Groups texts (partial notes) so each group fits `budgetTokens` for a
 * hierarchical reduce pass. `perItemOverheadTokens` reserves room for the
 * "Part N:" headers and separators the merge prompt adds around each text.
 * Preserves order; every group has at least one text.
 */
export const groupTextsByBudget = (
  texts: string[],
  budgetTokens: number,
  perItemOverheadTokens = 8
): string[][] => {
  const groups: string[][] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const text of texts) {
    const tokens = estimateTokens(text) + perItemOverheadTokens;
    if (current.length > 0 && currentTokens + tokens > budgetTokens) {
      groups.push(current);
      current = [];
      currentTokens = 0;
    }
    current.push(text);
    currentTokens += tokens;
  }
  if (current.length > 0) groups.push(current);

  return groups;
};
