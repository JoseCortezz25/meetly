import type { WebLLMLanguageModel, WebLLMProgress } from '@browser-ai/web-llm';
import type {
  ActionItem,
  MeetingNotes,
  NotesErrorCode,
  NotesGenerationProgress,
  TranscriptTurn
} from '../types/meeting-detail.types';

/** WebGPU model used for note generation (matches the app's "Llama 3.2 3B" label). */
export const NOTES_MODEL_ID = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
export const NOTES_MODEL_LABEL = 'Llama 3.2 3B';

export class NotesError extends Error {
  constructor(
    public readonly code: NotesErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'NotesError';
  }
}

const SYSTEM_PROMPT = [
  'You are a meeting-notes assistant. Read the meeting transcript and produce concise, factual notes.',
  'Write in the SAME LANGUAGE as the transcript.',
  'Output ONLY the four sections below, with these exact headers and nothing else:',
  '',
  '## Summary',
  '<one short paragraph, 2-4 sentences>',
  '',
  '## Key points',
  '- <point>',
  '',
  '## Action items',
  '- <task> :: <owner or -> :: <due or ->',
  '',
  '## Decisions',
  '- <decision>',
  '',
  'Rules: do not invent details that are not in the transcript. If a section has no content, write "- none".'
].join('\n');

type GenerateNotesOptions = {
  onProgress?: (progress: NotesGenerationProgress) => void;
  onText?: (partial: string) => void;
  /** Cancels generation (e.g. when the user navigates to another note). */
  signal?: AbortSignal;
};

const buildPrompt = (transcript: TranscriptTurn[]): string => {
  const body = transcript.map(turn => `[${turn.time}] ${turn.text}`).join('\n');
  return `Meeting transcript:\n\n${body}`;
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
 * Single WebLLM instance shared across every note. The model is downloaded and
 * initialized into GPU memory only once; each call to `webLLM(...)` would
 * otherwise build a fresh engine and reload the whole model.
 */
let notesModel: WebLLMLanguageModel | null = null;

/**
 * Progress listener for the currently active generation. The engine's
 * `initProgressCallback` is fixed at construction time, so it forwards reports
 * to whichever note is loading the model right now.
 */
let currentProgressListener: ((report: WebLLMProgress) => void) | null = null;

/**
 * Returns the shared WebLLM model, creating it on first use. The instance
 * deduplicates its own initialization, so concurrent callers await the same
 * download instead of triggering competing loads.
 * Client-only: dynamically imported so the WebGPU engine never reaches SSR.
 */
const getNotesModel = async (): Promise<WebLLMLanguageModel> => {
  const { webLLM, doesBrowserSupportWebLLM } = await import(
    '@browser-ai/web-llm'
  );

  if (!doesBrowserSupportWebLLM()) {
    throw new NotesError('no-webgpu', 'This browser does not support WebGPU.');
  }

  if (!notesModel) {
    notesModel = webLLM(NOTES_MODEL_ID, {
      initProgressCallback: report => currentProgressListener?.(report)
    });
  }

  return notesModel;
};

/**
 * Generates meeting notes from a transcript, fully on-device via WebLLM.
 * Reuses the shared model, so only the first note pays the load cost.
 */
export const generateNotes = async (
  transcript: TranscriptTurn[],
  { onProgress, onText, signal }: GenerateNotesOptions = {}
): Promise<MeetingNotes> => {
  const { streamText } = await import('ai');
  const model = await getNotesModel();

  const progressListener = (report: WebLLMProgress) =>
    onProgress?.({
      stage: 'loading',
      progress: report.progress ?? 0,
      text: report.text
    });
  currentProgressListener = progressListener;

  try {
    let streamError: unknown = null;
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(transcript),
      abortSignal: signal,
      onError: ({ error }) => {
        streamError = error;
      }
    });

    let accumulated = '';
    for await (const delta of result.textStream) {
      accumulated += delta;
      onProgress?.({ stage: 'generating', progress: 1 });
      onText?.(accumulated);
    }

    if (streamError) {
      throw new NotesError(
        'unknown',
        'The model failed while generating notes.'
      );
    }

    return parseNotes(accumulated);
  } finally {
    // Only detach if a newer generation hasn't already taken over the listener.
    if (currentProgressListener === progressListener) {
      currentProgressListener = null;
    }
  }
};
