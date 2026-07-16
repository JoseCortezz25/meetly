import { cn } from '@/lib/utils';
import { ModeDot } from '../atoms/mode-dot';
import { captureModeLabels } from '../../messages';
import type { AudioMode } from '../../types/meeting.types';

type ModeSelectorProps = {
  modes: AudioMode[];
  activeMode: AudioMode | null;
  /** Locked while a session is running — mode can't change mid-recording. */
  isLocked: boolean;
  onSelect: (mode: AudioMode) => void;
};

export const ModeSelector = ({
  modes,
  activeMode,
  isLocked,
  onSelect
}: ModeSelectorProps) => {
  return (
    <div className="flex justify-center">
      <div
        className={cn(
          'border-line bg-ink inline-flex gap-[3px] rounded-full border p-1 transition-opacity',
          isLocked && 'opacity-70'
        )}
        role="group"
      >
        {modes.map(mode => {
          const isSelected = mode === activeMode;
          return (
            <button
              key={mode}
              type="button"
              disabled={isLocked}
              aria-pressed={isSelected}
              onClick={() => onSelect(mode)}
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-[9px] text-[13.5px] font-semibold transition-colors',
                isSelected ? 'bg-cream text-ink' : 'text-sand hover:text-cream',
                isLocked && !isSelected && 'cursor-not-allowed',
                !isLocked && 'cursor-pointer'
              )}
            >
              <ModeDot mode={mode} />
              {captureModeLabels[mode]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
