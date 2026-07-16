import { cn } from '@/lib/utils';
import type { MeetingStatus } from '../../types/meeting.types';

type StatusBadgeProps = {
  status: MeetingStatus;
  label: string;
};

const statusStyles: Record<MeetingStatus, string> = {
  ready: 'text-ok bg-ok/10',
  processing: 'text-gold bg-gold/10',
  recording: 'text-mic bg-mic/15'
};

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.4px] uppercase',
        statusStyles[status]
      )}
    >
      {label}
    </span>
  );
};
