import Link from 'next/link';
import { cn } from '@/lib/utils';
import { StatusBadge } from '../atoms/status-badge';
import { ModeDot } from '../atoms/mode-dot';
import { meetingStatusLabels, notesListMessages } from '../../messages';
import type { MeetingDetail } from '../../types/meeting-detail.types';

type NoteListCardProps = {
  meeting: MeetingDetail;
};

export const NoteListCard = ({ meeting }: NoteListCardProps) => {
  return (
    <Link
      href={`/meeting/${meeting.id}`}
      className={cn(
        'border-line bg-ink-2 rounded-card group block border p-5',
        'transition-[transform,background-color,border-color] hover:-translate-y-[3px]',
        'hover:border-line-2 hover:bg-ink-3'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-cream text-[19px] font-medium tracking-[-0.2px]">
          {meeting.title}
        </h3>
        <span className="text-sand-2 shrink-0 font-mono text-[12.5px]">
          {meeting.duration}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2.5">
        <StatusBadge
          status={meeting.status}
          label={meetingStatusLabels[meeting.status]}
        />
        <span className="text-sand font-mono text-[12.5px]">
          {meeting.dateLabel}
        </span>
        <span className="flex items-center gap-1.5">
          {meeting.modes.map(mode => (
            <ModeDot key={mode} mode={mode} />
          ))}
        </span>
      </div>

      {meeting.notes.summary.trim().length > 0 ? (
        <>
          <p className="text-sand mt-3.5 line-clamp-2 text-[14.5px] leading-[1.6]">
            {meeting.notes.summary}
          </p>
          <div className="text-sand-2 mt-4 flex gap-4 font-mono text-[12px]">
            <span>
              {notesListMessages.keyPointCount(meeting.notes.keyPoints.length)}
            </span>
            <span>
              {notesListMessages.actionItemCount(
                meeting.notes.actionItems.length
              )}
            </span>
          </div>
        </>
      ) : (
        <p className="text-sand-2 mt-3.5 font-mono text-[12.5px]">
          {notesListMessages.pendingNotes}
        </p>
      )}
    </Link>
  );
};
