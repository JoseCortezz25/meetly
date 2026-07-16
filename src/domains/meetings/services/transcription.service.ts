import type { ASRModel } from 'browser-whisper';
import type { TranscriptTurn } from '../types/meeting-detail.types';
import type { TranscriptionProgress } from '../types/recording.types';

type TranscribeOptions = {
  model?: ASRModel;
  /** BCP-47 code, e.g. "en". Omit for auto-detect. */
  language?: string;
  onProgress?: (progress: TranscriptionProgress) => void;
  onSegment?: (turn: TranscriptTurn) => void;
};

const pad2 = (value: number): string => value.toString().padStart(2, '0');

/** Seconds → "mm:ss" clock label anchored to the recording start. */
const formatClock = (seconds: number): string => {
  const whole = Math.max(0, Math.floor(seconds));
  return `${pad2(Math.floor(whole / 60))}:${pad2(whole % 60)}`;
};

/**
 * Runs on-device transcription over a recorded Blob using browser-whisper.
 * Client-only: dynamically imported so the Web Worker / WASM / WebGPU code never
 * reaches the server bundle. Returns segment-level turns (no speaker diarization).
 */
export const transcribeRecording = async (
  blob: Blob,
  {
    model = 'whisper-base',
    language,
    onProgress,
    onSegment
  }: TranscribeOptions = {}
): Promise<TranscriptTurn[]> => {
  const { BrowserWhisper } = await import('browser-whisper');

  const whisper = new BrowserWhisper({
    model,
    ...(language ? { language } : {})
  });

  // browser-whisper decodes via WebCodecs; wrap the Blob as a File for naming.
  const file = new File([blob], 'meetly-recording.webm', {
    type: blob.type || 'audio/webm'
  });

  const turns: TranscriptTurn[] = [];
  let index = 0;

  for await (const segment of whisper.transcribe(file, {
    onProgress: progress => onProgress?.(progress)
  })) {
    const text = segment.text.trim();
    if (text.length === 0) continue;
    const turn: TranscriptTurn = {
      id: `seg-${index}`,
      time: formatClock(segment.start),
      text
    };
    index += 1;
    turns.push(turn);
    onSegment?.(turn);
  }

  onProgress?.({ stage: 'done', progress: 1 });
  return turns;
};
