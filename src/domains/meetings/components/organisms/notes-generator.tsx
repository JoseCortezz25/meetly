'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { NOTES_REQUIREMENTS } from '@/lib/system-capabilities';
import { RequirementsModal } from '@/components/system/requirements-modal';
import { useSystemCapabilities } from '@/components/system/use-system-capabilities';
import {
  generateNotes,
  NotesError
} from '../../services/notes-generation.service';
import { notesErrorLabels, notesGeneratorMessages } from '../../messages';
import type {
  MeetingNotes,
  NotesErrorCode,
  NotesGenerationProgress,
  TranscriptTurn
} from '../../types/meeting-detail.types';

type NotesGeneratorProps = {
  transcript: TranscriptTurn[];
  onGenerated: (notes: MeetingNotes) => void;
};

type GeneratorState = 'idle' | 'running' | 'error';

/** Status line for the running card, including chunked-generation progress. */
const resolveRunningLabel = (
  progress: NotesGenerationProgress | null
): string => {
  if (progress?.stage === 'loading') return notesGeneratorMessages.loadingModel;
  if (progress?.stage === 'combining') return notesGeneratorMessages.combining;
  if (progress?.currentChunk && progress?.totalChunks) {
    return notesGeneratorMessages.generatingChunk(
      progress.currentChunk,
      progress.totalChunks
    );
  }
  return notesGeneratorMessages.generating;
};

export const NotesGenerator = ({
  transcript,
  onGenerated
}: NotesGeneratorProps) => {
  const [state, setState] = useState<GeneratorState>('idle');
  const [progress, setProgress] = useState<NotesGenerationProgress | null>(
    null
  );
  const [draft, setDraft] = useState('');
  const [errorCode, setErrorCode] = useState<NotesErrorCode>('unknown');
  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const caps = useSystemCapabilities(NOTES_REQUIREMENTS);

  const run = useCallback(async () => {
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
  }, [transcript, onGenerated]);

  // Auto-start once the browser check passes. If WebGPU is missing we hold and
  // show the requirements modal; "Continue anyway" (dismiss) lets it try.
  useEffect(() => {
    if (startedRef.current || caps.status !== 'ready') return;
    if (!caps.isSupported && !caps.dismissed) return;
    startedRef.current = true;
    void run();
  }, [run, caps.status, caps.isSupported, caps.dismissed]);

  // Cancel any in-flight generation when navigating away.
  useEffect(() => () => abortRef.current?.abort(), []);

  if (state === 'error') {
    return (
      <div className="border-line rounded-card flex flex-col items-center border border-dashed px-6 py-12 text-center">
        <span className="bg-mic/15 text-mic grid size-11 place-items-center rounded-full">
          <TriangleAlert className="size-5" />
        </span>
        <p className="text-sand mt-4 max-w-[420px] text-[14px] leading-[1.5]">
          {notesErrorLabels[errorCode]}
        </p>
        <button
          type="button"
          onClick={run}
          className="border-line-2 hover:bg-ink-3 text-cream mt-5 rounded-full border px-5 py-2.5 text-[13.5px] font-semibold transition-colors"
        >
          {notesGeneratorMessages.retry}
        </button>
      </div>
    );
  }

  if (state === 'running') {
    const isLoadingModel = progress?.stage === 'loading';
    const isChunkedGenerating =
      progress?.stage === 'generating' && progress.totalChunks != null;
    const pct = Math.round((progress?.progress ?? 0) * 100);
    return (
      <div className="border-line rounded-card border p-6">
        <div className="flex items-center gap-2.5">
          <Loader2 className="text-sys size-[18px] animate-spin" />
          <span className="text-cream text-[14px] font-semibold">
            {resolveRunningLabel(progress)}
          </span>
        </div>

        {(isLoadingModel || isChunkedGenerating) && (
          <>
            <div className="bg-ink-4 mt-4 h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-sys h-full rounded-full transition-[width] duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
            {progress?.text && (
              <p className="text-sand-2 mt-2 text-[12px]">{progress.text}</p>
            )}
          </>
        )}

        {draft && (
          <div className="border-line bg-ink mt-5 rounded-[12px] border p-4">
            <p className="text-sand-2 mb-2 text-[11px] font-semibold tracking-[1px] uppercase">
              {notesGeneratorMessages.previewHeading}
            </p>
            <pre className="text-sand max-h-64 overflow-y-auto font-sans text-[13.5px] leading-[1.6] whitespace-pre-wrap">
              {draft}
            </pre>
          </div>
        )}
      </div>
    );
  }

  const isBlocked =
    caps.status === 'ready' && caps.missing.length > 0 && !caps.dismissed;

  return (
    <>
      <div className="border-line rounded-card flex flex-col items-center border border-dashed px-6 py-12 text-center">
        <span className="bg-gold/15 text-gold grid size-11 place-items-center rounded-full">
          <Sparkles className="size-5" />
        </span>
        <h3 className="font-display text-cream mt-4 text-[20px] font-medium tracking-[-0.2px]">
          {notesGeneratorMessages.title}
        </h3>
        <p className="text-sand mt-1.5 max-w-[440px] text-[14px] leading-[1.5]">
          {notesGeneratorMessages.description}
        </p>
        <button
          type="button"
          onClick={run}
          className="bg-cream text-ink mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-transform duration-100 hover:-translate-y-0.5 [&_svg]:size-[16px]"
        >
          <Sparkles />
          {notesGeneratorMessages.cta}
        </button>
      </div>
      {isBlocked && (
        <RequirementsModal
          missing={caps.missing}
          report={caps.report}
          onContinue={caps.dismiss}
          onRecheck={caps.recheck}
        />
      )}
    </>
  );
};
