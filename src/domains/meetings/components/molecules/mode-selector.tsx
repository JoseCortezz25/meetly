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
          'border-line bg-ink inline-flex max-w-full flex-wrap justify-center gap-[3px] rounded-[24px] border p-1 transition-opacity sm:flex-nowrap sm:rounded-full',
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
                'flex items-center gap-2 rounded-full px-4 py-[9px] text-[13px] font-semibold transition-colors sm:px-5 sm:text-[13.5px]',
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
