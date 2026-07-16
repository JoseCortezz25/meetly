import { cn } from '@/lib/utils';
import type { ParticipantColor } from '../../types/meeting-detail.types';

type ParticipantAvatarProps = {
  initials: string;
  color: ParticipantColor;
};

const colorStyles: Record<ParticipantColor, string> = {
  mic: 'bg-mic/20 text-mic',
  sys: 'bg-sys/20 text-sys',
  gold: 'bg-gold/20 text-gold',
  ok: 'bg-ok/20 text-ok'
};

export const ParticipantAvatar = ({
  initials,
  color
}: ParticipantAvatarProps) => {
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold',
        colorStyles[color]
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
};
