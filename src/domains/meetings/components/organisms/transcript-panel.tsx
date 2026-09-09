'use client';

import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopyToClipboard } from '../../hooks/use-copy-to-clipboard';
import { transcriptToPlainText } from '../../services/meeting-export.service';
import { meetingDetailMessages } from '../../messages';
import type { TranscriptTurn } from '../../types/meeting-detail.types';

type TranscriptPanelProps = {
  transcript: TranscriptTurn[];
};

export const TranscriptPanel = ({ transcript }: TranscriptPanelProps) => {
  const { copy, status } = useCopyToClipboard();
  const { transcriptCopy } = meetingDetailMessages;

  if (transcript.length === 0) {
    return (
      <p className="text-sand-2 border-line rounded-card border border-dashed py-12 text-center text-[14px]">
        {meetingDetailMessages.transcriptEmpty}
      </p>
    );
  }

  const isCopied = status === 'copied';
  const copyLabel = isCopied
    ? transcriptCopy.copied
    : status === 'error'
      ? transcriptCopy.error
      : transcriptCopy.label;

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => copy(transcriptToPlainText(transcript))}
        aria-label={transcriptCopy.ariaLabel}
        className={cn(
          'border-line-2 text-sand hover:border-cream hover:text-cream inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
          isCopied && 'bg-sys/15 text-sys border-transparent'
        )}
      >
        {isCopied ? (
          <Check className="size-[15px]" />
        ) : (
          <Copy className="size-[15px]" />
        )}
        {copyLabel}
      </button>

      <ol className="border-line ml-[5px] max-w-[720px] border-l">
        {transcript.map(turn => (
          <li key={turn.id} className="group relative pb-7 pl-7 last:pb-0">
            <span
              className="bg-sys ring-ink absolute top-[7px] -left-[5px] size-2.5 rounded-full ring-4 transition-transform group-hover:scale-125"
              aria-hidden
            />
            <div className="flex items-center gap-2.5">
              {turn.speaker && (
                <span className="text-cream text-[13.5px] font-semibold">
                  {turn.speaker}
                </span>
              )}
              <span className="bg-ink-2 text-sand-2 rounded-md px-1.5 py-0.5 font-mono text-[11.5px] tabular-nums">
                {turn.time}
              </span>
            </div>
            <p className="text-sand group-hover:text-cream mt-2 text-[15px] leading-[1.7] transition-colors">
              {turn.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
};
