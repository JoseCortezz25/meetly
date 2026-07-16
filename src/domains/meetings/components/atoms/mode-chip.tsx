import { ModeDot } from './mode-dot';
import type { AudioMode } from '../../types/meeting.types';

type ModeChipProps = {
  mode: AudioMode;
  label: string;
};

export const ModeChip = ({ mode, label }: ModeChipProps) => {
  return (
    <span className="border-line-2 text-cream inline-flex items-center gap-2 rounded-full border bg-white/[0.02] px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-white/[0.05]">
      <ModeDot mode={mode} />
      {label}
    </span>
  );
};
