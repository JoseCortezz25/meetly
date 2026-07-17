import { describe, expect, it } from '@jest/globals';
import {
  chunkTranscriptTurns,
  estimateTokens,
  formatTranscriptTurn,
  groupTextsByBudget,
  NOTES_CONTEXT_WINDOW_TOKENS,
  NOTES_INPUT_BUDGET_TOKENS
} from './notes-chunking.util';
import type { TranscriptTurn } from '../types/meeting-detail.types';

const makeTurn = (id: number, text: string): TranscriptTurn => ({
  id: `turn-${id}`,
  time: `0${id}:00`,
  text
});

describe('estimateTokens', () => {
  it('estimates conservatively at ~4 chars per token, rounding up', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
    expect(estimateTokens('a'.repeat(400))).toBe(100);
  });
});

describe('budget constants', () => {
  it('leaves headroom inside the model context window', () => {
    expect(NOTES_INPUT_BUDGET_TOKENS).toBeLessThan(NOTES_CONTEXT_WINDOW_TOKENS);
    // At least ~1300 tokens spare for system prompt + generated output.
    expect(
      NOTES_CONTEXT_WINDOW_TOKENS - NOTES_INPUT_BUDGET_TOKENS
    ).toBeGreaterThanOrEqual(1300);
  });
});

describe('chunkTranscriptTurns', () => {
  it('keeps a short transcript in a single chunk', () => {
    const transcript = [
      makeTurn(1, 'We reviewed the roadmap.'),
      makeTurn(2, 'The launch moves to next month.')
    ];

    const chunks = chunkTranscriptTurns(transcript, 100);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual(transcript);
  });

  it('splits on turn boundaries without altering any turn', () => {
    // Each formatted turn is ~26 tokens; a 60-token budget fits two per chunk.
    const transcript = Array.from({ length: 6 }, (_, index) =>
      makeTurn(index + 1, 'word '.repeat(19).trim())
    );

    const chunks = chunkTranscriptTurns(transcript, 60);

    expect(chunks.length).toBeGreaterThan(1);
    // Flattening the chunks reproduces the transcript exactly (no mid-turn cuts).
    expect(chunks.flat()).toEqual(transcript);
    for (const chunk of chunks) {
      const tokens = chunk.reduce(
        (sum, turn) => sum + estimateTokens(formatTranscriptTurn(turn)) + 1,
        0
      );
      expect(tokens).toBeLessThanOrEqual(60);
    }
  });

  it('splits a single oversized turn by sentences', () => {
    const sentences = Array.from(
      { length: 12 },
      (_, index) => `Sentence number ${index + 1} says something important.`
    );
    const oversized = makeTurn(1, sentences.join(' '));
    const budget = 40; // Far below the ~150 tokens of the full turn.

    const chunks = chunkTranscriptTurns([oversized], budget);

    expect(chunks.length).toBeGreaterThan(1);
    const parts = chunks.flat();
    // Synthetic sub-turns keep the original id as a prefix and its timestamp.
    for (const part of parts) {
      expect(part.id).toMatch(/^turn-1-part-\d+$/);
      expect(part.time).toBe(oversized.time);
      expect(estimateTokens(formatTranscriptTurn(part))).toBeLessThanOrEqual(
        budget
      );
    }
    // No content is lost or reordered.
    expect(parts.map(part => part.text).join(' ')).toBe(oversized.text);
  });

  it('flushes the running chunk before an oversized turn', () => {
    const transcript = [
      makeTurn(1, 'Short intro.'),
      makeTurn(2, 'Very long sentence. '.repeat(30).trim()),
      makeTurn(3, 'Short outro.')
    ];

    const chunks = chunkTranscriptTurns(transcript, 40);

    expect(chunks[0]).toEqual([transcript[0]]);
    const texts = chunks.flat().map(turn => turn.text);
    expect(texts[texts.length - 1]).toBe('Short outro.');
  });
});

describe('groupTextsByBudget', () => {
  it('groups partial notes so hierarchical reduce shrinks the list', () => {
    // Each text is ~100 tokens; with overhead, a 250-token budget fits two.
    const partials = Array.from({ length: 5 }, (_, index) =>
      `note-${index + 1} `.padEnd(400, 'x')
    );

    const groups = groupTextsByBudget(partials, 250);

    expect(groups.length).toBeLessThan(partials.length);
    expect(groups.flat()).toEqual(partials);
    for (const group of groups) {
      const tokens = group.reduce(
        (sum, text) => sum + estimateTokens(text) + 8,
        0
      );
      expect(tokens).toBeLessThanOrEqual(250);
    }
  });

  it('never produces an empty group, even when one text exceeds the budget', () => {
    const oversized = 'y'.repeat(2000); // ~500 tokens, over a 100-token budget.
    const groups = groupTextsByBudget(['a'.repeat(40), oversized], 100);

    expect(groups).toEqual([['a'.repeat(40)], [oversized]]);
  });
});
