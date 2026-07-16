import { cn } from '@/lib/utils';
import type { AudioMode } from '../../types/meeting.types';

type ModeDotProps = {
  mode: AudioMode;
  className?: string;
};

const dotStyles: Record<AudioMode, string> = {
  mic: 'bg-mic',
  sys: 'bg-sys',
  mix: 'bg-gradient-to-r from-mic to-sys'
};

export const ModeDot = ({ mode, className }: ModeDotProps) => {
  return (
    <span
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        dotStyles[mode],
        className
      )}
    />
  );
};
