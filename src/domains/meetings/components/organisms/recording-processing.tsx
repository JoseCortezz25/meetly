import { Download, Loader2, RotateCcw, TriangleAlert } from 'lucide-react';
import { processingMessages } from '../../messages';
import type { TranscriptTurn } from '../../types/meeting-detail.types';
import type {
  RecordingResult,
  TranscriptionProgress
} from '../../types/recording.types';

type RecordingProcessingProps = {
  transcription: TranscriptionProgress | null;
  liveSegments: TranscriptTurn[];
  processingFailed: boolean;
  result: RecordingResult | null;
  /** File stem (no extension) used for the fallback audio download. */
  downloadName: string;
  onRetry: () => void;
  onRecordAgain: () => void;
};

export const RecordingProcessing = ({
  transcription,
  liveSegments,
  processingFailed,
  result,
  downloadName,
  onRetry,
  onRecordAgain
}: RecordingProcessingProps) => {
  if (processingFailed) {
    const { error } = processingMessages;
    return (
      <section className="border-line rounded-lg border bg-[radial-gradient(120%_90%_at_50%_-10%,_rgba(239,125,78,0.08),_transparent_60%),_var(--color-ink-2)] p-[30px]">
        <div className="mx-auto flex max-w-[520px] flex-col items-center text-center">
          <span className="bg-mic/15 text-mic grid size-11 place-items-center rounded-full">
            <TriangleAlert className="size-5" />
          </span>
          <h2 className="font-display text-cream mt-4 text-[24px] font-medium tracking-[-0.4px]">
            {error.title}
          </h2>
          <p className="text-sand mt-1.5 text-[14px] leading-[1.5]">
            {error.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="bg-mic text-ink inline-flex items-center gap-2.5 rounded-full px-[22px] py-[13px] text-[14px] font-semibold transition-transform duration-100 hover:-translate-y-0.5 [&_svg]:size-[18px]"
            >
              <RotateCcw />
              {error.retry}
            </button>
            {result && (
              <a
                href={result.url}
                download={`${downloadName}.webm`}
                className="border-line-2 hover:bg-ink-3 text-cream inline-flex items-center gap-2.5 rounded-full border px-[22px] py-[13px] text-[14px] font-semibold transition-colors [&_svg]:size-[18px]"
              >
                <Download />
                {error.download}
              </a>
            )}
            <button
              type="button"
              onClick={onRecordAgain}
              className="text-sand hover:text-cream rounded-full px-4 py-[13px] text-[14px] font-semibold transition-colors"
            >
              {error.recordAgain}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const stage = transcription?.stage ?? 'loading';
  const progressPct = Math.round((transcription?.progress ?? 0) * 100);

  return (
    <section className="border-line rounded-lg border bg-[radial-gradient(120%_90%_at_50%_-10%,_rgba(92,199,191,0.08),_transparent_60%),_var(--color-ink-2)] p-[30px]">
      <div className="mx-auto flex max-w-[560px] flex-col items-center text-center">
        <span className="bg-sys/15 text-sys grid size-11 place-items-center rounded-full">
          <Loader2 className="size-5 animate-spin" />
        </span>
        <h2 className="font-display text-cream mt-4 text-[24px] font-medium tracking-[-0.4px]">
          {processingMessages.title}
        </h2>
        <p className="text-sand mt-1.5 text-[14px] leading-[1.5]">
          {processingMessages.stages[stage]}
        </p>

        <div className="bg-ink-4 mt-6 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-sys h-full rounded-full transition-[width] duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-sand-2 mt-2 text-[12px]">
          {processingMessages.firstRunHint}
        </p>

        {liveSegments.length > 0 && (
          <div className="border-line bg-ink mt-6 w-full rounded-[12px] border p-4 text-left">
            <p className="text-sand-2 mb-3 text-[11px] font-semibold tracking-[1px] uppercase">
              {processingMessages.liveHeading}
            </p>
            <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
              {liveSegments.map(turn => (
                <p
                  key={turn.id}
                  className="text-sand flex gap-2.5 text-[13.5px] leading-snug"
                >
                  <span className="text-sand-2 shrink-0 font-mono text-[11.5px]">
                    {turn.time}
                  </span>
                  {turn.text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
