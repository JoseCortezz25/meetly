import type { Meeting } from './meeting.types';

/** Which panel of the meeting detail is currently shown. */
export type NotesTab = 'notes' | 'transcript';

/** Accent color for a participant avatar (maps to a channel/theme color). */
export type ParticipantColor = 'mic' | 'sys' | 'gold' | 'ok';

export type ActionItem = {
  id: string;
  title: string;
  owner: string;
  /** Human-readable due label, e.g. "Due Thu" or "Next sprint". */
  due: string;
  done: boolean;
};

export type Participant = {
  id: string;
  name: string;
  initials: string;
  color: ParticipantColor;
};

export type TranscriptTurn = {
  id: string;
  /** Optional — raw transcription has no speaker diarization. */
  speaker?: string;
  /** Timestamp within the recording, e.g. "01:40". */
  time: string;
  text: string;
};

export type MeetingNotes = {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
};

/** Phase of on-device note generation (WebLLM). */
export type NotesGenerationStage = 'loading' | 'generating' | 'combining';

export type NotesGenerationProgress = {
  stage: NotesGenerationStage;
  /** 0–1 during model download and chunked generation; 1 when indeterminate. */
  progress: number;
  text?: string;
  /** 1-based index of the transcript chunk being summarized (long transcripts only). */
  currentChunk?: number;
  /** Total transcript chunks in the current run (long transcripts only). */
  totalChunks?: number;
};

export type NotesErrorCode = 'no-webgpu' | 'context-overflow' | 'unknown';

/** A meeting persisted locally (IndexedDB): full detail + audio + sort key. */
export type StoredMeeting = MeetingDetail & {
  /** Epoch ms of when the recording was saved — used for ordering. */
  createdAt: number;
  /** The captured audio, kept for playback/download/re-transcription. */
  audioBlob?: Blob;
};

/** A recorded meeting enriched with its AI notes, transcript, and metadata. */
export type MeetingDetail = Meeting & {
  /** Absolute date label, e.g. "15 Jul 2026". */
  dateLabel: string;
  /** Start time label, e.g. "14:20". */
  timeLabel: string;
  tag: string;
  model: string;
  language: string;
  participants: Participant[];
  notes: MeetingNotes;
  transcript: TranscriptTurn[];
};
