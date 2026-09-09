'use client';

import { useEffect, useRef, useState } from 'react';
import {
  generateNotes,
  NotesError
} from '../services/notes-generation.service';
import type {
  MeetingNotes,
  NotesErrorCode,
  NotesGenerationProgress,
  TranscriptTurn
} from '../types/meeting-detail.types';

export type NotesGenerationState = 'idle' | 'running' | 'error';

type UseNotesGenerationOptions = {
  transcript: TranscriptTurn[];
  onGenerated: (notes: MeetingNotes) => void;
  /** Starts the first generation automatically once this turns true. */
  autoStart?: boolean;
};

/**
 * Drives on-device notes generation: run/abort lifecycle, streamed draft text,
 * progress reports, and error mapping. Re-running aborts the previous pass and
 * unmounting aborts any in-flight generation.
 */
export const useNotesGeneration = ({
  transcript,
  onGenerated,
  autoStart = false
}: UseNotesGenerationOptions) => {
  const [state, setState] = useState<NotesGenerationState>('idle');
  const [progress, setProgress] = useState<NotesGenerationProgress | null>(
    null
  );
  const [draft, setDraft] = useState('');
  const [errorCode, setErrorCode] = useState<NotesErrorCode>('unknown');
  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState('running');
    setDraft('');
    setProgress({ stage: 'loading', progress: 0 });
    try {
      const notes = await generateNotes(transcript, {
        onProgress: setProgress,
        onText: setDraft,
        signal: controller.signal
      });
      onGenerated(notes);
    } catch (error) {
      if (controller.signal.aborted) return;
      setErrorCode(error instanceof NotesError ? error.code : 'unknown');
      setState('error');
    }
  };

  // Auto-start a single time once allowed (e.g. after the WebGPU check passes).
  // `startedRef` keeps re-renders and later `autoStart` flips from restarting.
  // `handleGenerate` is intentionally out of the deps: it is recreated per
  // render (no useCallback — React Compiler) and the ref guards the one start.
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    void handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Cancel any in-flight generation when the consumer unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  return { state, progress, draft, errorCode, handleGenerate };
};
