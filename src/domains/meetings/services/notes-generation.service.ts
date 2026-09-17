import type { LanguageModel } from 'ai';
import type { WebLLMLanguageModel, WebLLMProgress } from '@browser-ai/web-llm';
import {
  getNotesLanguage,
  getNotesModelId,
  getResolvedNotesEngine,
  type ResolvedNotesEngine
} from '@/lib/notes-settings';
import {
  chunkTranscriptTurns,
  estimateTokens,
  formatTranscriptTurn,
  groupTextsByBudget,
  NOTES_INPUT_BUDGET_TOKENS
} from '../utils/notes-chunking.util';
import {
  buildNotesSystemPrompts,
  type NotesSystemPrompts
} from '../utils/notes-prompts.util';
import type {
  ActionItem,
  MeetingNotes,
  NotesErrorCode,
  NotesGenerationProgress,
  TranscriptTurn
} from '../types/meeting-detail.types';

export class NotesError extends Error {
  constructor(
    public readonly code: NotesErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'NotesError';
  }
}

type GenerateNotesOptions = {
  onProgress?: (progress: NotesGenerationProgress) => void;
  onText?: (partial: string) => void;
  /** Cancels generation (e.g. when the user navigates to another note). */
  signal?: AbortSignal;
};

const buildPrompt = (transcript: TranscriptTurn[]): string => {
  const body = transcript.map(formatTranscriptTurn).join('\n');
  return `Meeting transcript:\n\n${body}`;
};

const buildMergePrompt = (partials: string[]): string => {
  const body = partials
    .map((partial, index) => `Part ${index + 1}:\n${partial}`)
    .join('\n\n---\n\n');
  return `Partial meeting notes:\n\n${body}`;
};

type Section = 'summary' | 'keyPoints' | 'actionItems' | 'decisions';

const HEADER_TO_SECTION: Record<string, Section> = {
  summary: 'summary',
  'key points': 'keyPoints',
  keypoints: 'keyPoints',
  'action items': 'actionItems',
  actionitems: 'actionItems',
  decisions: 'decisions'
};

const stripBullet = (line: string): string =>
  line.replace(/^[-*•]\s*/, '').trim();

const isNone = (value: string): boolean =>
  /^(-|none|n\/a)$/i.test(value.trim());

const parseActionItem = (raw: string, index: number): ActionItem | null => {
  const line = stripBullet(raw);
  if (line.length === 0 || isNone(line)) return null;
  const parts = line.split(/\s*::\s*|\s*\|\s*/).map(part => part.trim());
  const [title, owner = '', due = ''] = parts;
  if (!title || isNone(title)) return null;
  return {
    id: `note-action-${index}`,
    title,
    owner: isNone(owner) ? '' : owner,
    due: isNone(due) ? '' : due,
    done: false
  };
};

/** Parses the model's delimited Markdown into structured notes (lenient). */
export const parseNotes = (raw: string): MeetingNotes => {
  const notes: MeetingNotes = {
    summary: '',
    keyPoints: [],
    actionItems: [],
    decisions: []
  };
  const summaryLines: string[] = [];
  let current: Section | null = null;
  let sawHeader = false;

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    const headerMatch =
      line.match(/^#{1,6}\s*(.+?)\s*:?$/) ??
      (line.match(/^([A-Za-z ]+):$/) ? [line, line.replace(/:$/, '')] : null);
    const headerKey = headerMatch ? headerMatch[1].toLowerCase().trim() : null;

    if (headerKey && HEADER_TO_SECTION[headerKey]) {
      current = HEADER_TO_SECTION[headerKey];
      sawHeader = true;
      continue;
    }
    if (line.length === 0) continue;

    if (current === 'summary') {
      if (!isNone(line)) summaryLines.push(stripBullet(line));
    } else if (current === 'keyPoints') {
      const point = stripBullet(line);
      if (point && !isNone(point)) notes.keyPoints.push(point);
    } else if (current === 'decisions') {
      const decision = stripBullet(line);
      if (decision && !isNone(decision)) notes.decisions.push(decision);
    } else if (current === 'actionItems') {
      const item = parseActionItem(line, notes.actionItems.length);
      if (item) notes.actionItems.push(item);
    } else if (!sawHeader) {
      // No recognized headers yet — treat leading prose as the summary.
      summaryLines.push(stripBullet(line));
    }
  }

  notes.summary = summaryLines.join(' ').trim();
  return notes;
};

/**
 * True when the error chain contains WebLLM's context-window overflow.
 * `@mlc-ai/web-llm` throws `ContextWindowSizeExceededError` but does not
 * export the class, so it is matched by name/message instead of `instanceof`.
 */
const isContextOverflowError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  if (
    error.name === 'ContextWindowSizeExceededError' ||
    error.message.includes('context window size')
  ) {
    return true;
  }
  return isContextOverflowError(error.cause);
};

const toNotesError = (error: unknown, isRemote: boolean): NotesError => {
  if (error instanceof NotesError) return error;
  if (isContextOverflowError(error)) {
    return new NotesError(
      'context-overflow',
      'The prompt exceeded the model context window.'
    );
  }
  if (isRemote) {
    return new NotesError(
      'provider-error',
      'The AI provider failed while generating notes.'
    );
  }
  return new NotesError('unknown', 'The model failed while generating notes.');
};

/**
 * Single WebLLM instance shared across every note. The model is downloaded and
 * initialized into GPU memory only once; each call to `webLLM(...)` would
 * otherwise build a fresh engine and reload the whole model. Keyed by model id
 * so switching the model in Settings rebuilds the engine, not every note.
 */
let notesEngine: WebLLMLanguageModel | null = null;
let notesEngineModelId: string | null = null;
let notesEngineWorker: Worker | null = null;

/**
 * Progress listener for the currently active generation. The engine's
 * `initProgressCallback` is fixed at construction time, so it forwards reports
 * to whichever note is loading the model right now.
 */
let currentProgressListener: ((report: WebLLMProgress) => void) | null = null;

/**
 * Returns the shared WebLLM engine for the model chosen in Settings, creating it
 * on first use and rebuilding it only when the selected model changes. The
 * instance deduplicates its own initialization, so concurrent callers await the
 * same download instead of triggering competing loads.
 * Client-only: dynamically imported so the WebGPU engine never reaches SSR.
 */
const getNotesEngine = async (): Promise<WebLLMLanguageModel> => {
  const { webLLM, doesBrowserSupportWebLLM } = await import(
    '@browser-ai/web-llm'
  );

  if (!doesBrowserSupportWebLLM()) {
    throw new NotesError('no-webgpu', 'This browser does not support WebGPU.');
  }

  const modelId = getNotesModelId();
  if (!notesEngine || notesEngineModelId !== modelId) {
    // Terminate the previous worker first so the old model releases its
    // GPU/CPU memory before the new one loads.
    notesEngineWorker?.terminate();
    // Inference runs inside a Web Worker so model loading and token generation
    // never block the main thread during long map-reduce generations.
    notesEngineWorker = new Worker(
      new URL('../workers/notes-engine.worker.ts', import.meta.url),
      { type: 'module' }
    );
    notesEngine = webLLM(modelId, {
      initProgressCallback: report => currentProgressListener?.(report),
      worker: notesEngineWorker
    });
    notesEngineModelId = modelId;
  }

  return notesEngine;
};

type GenerationPassOptions = {
  system: string;
  prompt: string;
  signal?: AbortSignal;
  /** Remote passes map unknown failures to a provider-specific error. */
  isRemote?: boolean;
  /** Receives the accumulated text after each delta (final pass only). */
  onDelta?: (accumulated: string) => void;
};

/**
 * Runs one streamText pass and returns the full generated text. Each pass gets
 * its own error capture: `streamText` reports failures through `onError`
 * instead of throwing, so the error must be collected and re-thrown per call.
 */
const runGenerationPass = async (
  model: LanguageModel,
  { system, prompt, signal, isRemote = false, onDelta }: GenerationPassOptions
): Promise<string> => {
  const { streamText } = await import('ai');

  let streamError: unknown = null;
  const result = streamText({
    model,
    system,
    prompt,
    abortSignal: signal,
    onError: ({ error }) => {
      streamError = error;
    }
  });

  let accumulated = '';
  for await (const delta of result.textStream) {
    accumulated += delta;
    onDelta?.(accumulated);
  }

  if (streamError) throw toNotesError(streamError, isRemote);
  return accumulated;
};

/**
 * Map-reduce fallback for transcripts that exceed the model context window:
 * summarize each chunk into partial notes (map), then merge the partials —
 * hierarchically if needed — until one final pass fits. Only the final merge
 * streams to `onText`; intermediate passes surface through `onProgress` so the
 * UI never renders partial-notes garbage.
 */
const generateNotesChunked = async (
  model: LanguageModel,
  transcript: TranscriptTurn[],
  prompts: NotesSystemPrompts,
  { onProgress, onText, signal }: GenerateNotesOptions
): Promise<string> => {
  const chunks = chunkTranscriptTurns(transcript, NOTES_INPUT_BUDGET_TOKENS);

  const partials: string[] = [];
  for (const [index, chunk] of chunks.entries()) {
    signal?.throwIfAborted();
    onProgress?.({
      stage: 'generating',
      progress: index / chunks.length,
      currentChunk: index + 1,
      totalChunks: chunks.length
    });
    partials.push(
      await runGenerationPass(model, {
        system: prompts.chunk,
        prompt: buildPrompt(chunk),
        signal
      })
    );
  }

  // Hierarchical reduce: while the combined partials do not fit, merge them in
  // budget-sized groups. Each round with a group of 2+ shrinks the list, so a
  // round that cannot shrink it means the content can never fit — bail out.
  let merged = partials;
  while (
    merged.length > 1 &&
    estimateTokens(buildMergePrompt(merged)) > NOTES_INPUT_BUDGET_TOKENS
  ) {
    const groups = groupTextsByBudget(merged, NOTES_INPUT_BUDGET_TOKENS);
    if (groups.length >= merged.length) {
      throw new NotesError(
        'context-overflow',
        'Partial notes still exceed the model context window.'
      );
    }
    const next: string[] = [];
    for (const group of groups) {
      signal?.throwIfAborted();
      onProgress?.({ stage: 'combining', progress: 1 });
      next.push(
        group.length === 1
          ? group[0]
          : await runGenerationPass(model, {
              system: prompts.merge,
              prompt: buildMergePrompt(group),
              signal
            })
      );
    }
    merged = next;
  }

  // Final pass — the only one that streams to the UI.
  signal?.throwIfAborted();
  onProgress?.({ stage: 'combining', progress: 1 });
  return runGenerationPass(model, {
    system: prompts.merge,
    prompt: buildMergePrompt(merged),
    signal,
    onDelta: onText
  });
};

/**
 * Generates notes through a remote provider (Vercel AI SDK) using the user's
 * API key. Remote models have large context windows, so the whole transcript
 * runs in a single streamed pass — no on-device chunking / map-reduce.
 */
/**
 * Generates notes through a hosted provider. The call is proxied by the app's
 * own `/api/notes` route (a Vercel function) because providers like OpenAI and
 * OpenCode Go send no CORS headers, so the browser cannot reach them directly.
 * The key travels to that same-origin route per request and is never stored.
 * Remote models have large context windows, so it is a single streamed pass.
 */
const generateNotesRemote = async (
  engine: Extract<ResolvedNotesEngine, { mode: 'remote' }>,
  transcript: TranscriptTurn[],
  prompts: NotesSystemPrompts,
  { onProgress, onText, signal }: GenerateNotesOptions
): Promise<MeetingNotes> => {
  if (!engine.apiKey.trim()) {
    throw new NotesError(
      'api-key-missing',
      'No API key configured for the selected provider.'
    );
  }

  onProgress?.({ stage: 'generating', progress: 1 });

  let response: Response;
  try {
    response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: engine.provider.id,
        model: engine.model,
        apiKey: engine.apiKey,
        system: prompts.single,
        prompt: buildPrompt(transcript)
      }),
      signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new NotesError(
      'provider-error',
      'Could not reach the notes service.'
    );
  }

  if (response.status === 401) {
    throw new NotesError(
      'api-key-missing',
      'The provider rejected the API key.'
    );
  }
  if (!response.ok || !response.body) {
    throw new NotesError(
      'provider-error',
      'The AI provider failed while generating notes.'
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
    onText?.(raw);
  }

  if (raw.trim().length === 0) {
    throw new NotesError(
      'provider-error',
      'The AI provider returned an empty response.'
    );
  }

  return parseNotes(raw);
};

/**
 * Generates notes fully on-device via WebLLM. Reuses the shared engine, so only
 * the first note pays the load cost. Transcripts that fit the context window
 * run in a single streamed pass; longer ones fall back to map-reduce chunking.
 */
const generateNotesLocal = async (
  transcript: TranscriptTurn[],
  prompts: NotesSystemPrompts,
  { onProgress, onText, signal }: GenerateNotesOptions
): Promise<MeetingNotes> => {
  const model = await getNotesEngine();
  const progressListener = (report: WebLLMProgress) =>
    onProgress?.({
      stage: 'loading',
      progress: report.progress ?? 0,
      text: report.text
    });
  currentProgressListener = progressListener;

  try {
    const fullPrompt = buildPrompt(transcript);
    let raw: string;

    if (estimateTokens(fullPrompt) <= NOTES_INPUT_BUDGET_TOKENS) {
      onProgress?.({ stage: 'generating', progress: 1 });
      raw = await runGenerationPass(model, {
        system: prompts.single,
        prompt: fullPrompt,
        signal,
        onDelta: onText
      });
    } else {
      raw = await generateNotesChunked(model, transcript, prompts, {
        onProgress,
        onText,
        signal
      });
    }

    return parseNotes(raw);
  } finally {
    // Only detach if a newer generation hasn't already taken over the listener.
    if (currentProgressListener === progressListener) {
      currentProgressListener = null;
    }
  }
};

/**
 * Generates meeting notes from a transcript. Runs on-device via WebLLM by
 * default; if the user configured a remote provider + API key in Settings, it
 * runs through that provider (browser-side, using the user's own key). Language
 * and engine are resolved per call so a Settings change applies to the next run.
 */
export const generateNotes = async (
  transcript: TranscriptTurn[],
  options: GenerateNotesOptions = {}
): Promise<MeetingNotes> => {
  const prompts = buildNotesSystemPrompts(getNotesLanguage());
  const engine = getResolvedNotesEngine();

  return engine.mode === 'remote'
    ? generateNotesRemote(engine, transcript, prompts, options)
    : generateNotesLocal(transcript, prompts, options);
};
