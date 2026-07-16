import Link from 'next/link';
import { cn } from '@/lib/utils';
import { StatusBadge } from '../atoms/status-badge';
import { ModeDot } from '../atoms/mode-dot';
import { Waveform } from '../atoms/waveform';
import { meetingStatusLabels } from '../../messages';
import type { Meeting } from '../../types/meeting.types';

type MeetingCardProps = {
  meeting: Meeting;
  seed: number;
};

export const MeetingCard = ({ meeting, seed }: MeetingCardProps) => {
  return (
    <Link
      href={`/meeting/${meeting.id}`}
      className={cn(
        'border-line bg-ink-2 rounded-card group block cursor-pointer border p-[18px]',
        'transition-[transform,background-color,border-color] hover:-translate-y-[3px]',
        'hover:border-line-2 hover:bg-ink-3'
      )}
    >
      <div className="mb-3.5 flex items-center justify-between">
        <StatusBadge
          status={meeting.status}
          label={meetingStatusLabels[meeting.status]}
        />
        <div className="flex gap-1.5">
          {meeting.modes.map(mode => (
            <ModeDot key={mode} mode={mode} className="size-[7px]" />
          ))}
        </div>
      </div>
      <h3 className="text-cream mb-1.5 text-base font-semibold tracking-[-0.2px]">
        {meeting.title}
      </h3>
      <p className="text-sand font-mono text-[12.5px]">
        {meeting.when} · {meeting.duration}
      </p>
      <Waveform seed={seed} className="mt-3.5" />
    </Link>
  );
};
