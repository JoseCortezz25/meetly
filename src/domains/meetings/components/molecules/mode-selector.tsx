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
          'border-line bg-ink inline-flex max-w-full flex-wrap justify-center gap-0.5 rounded-2xl border p-[3px] transition-opacity sm:flex-nowrap sm:rounded-full',
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
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors sm:px-3.5',
                isSelected
                  ? 'bg-ink-2 text-cream'
                  : 'text-sand-2 hover:text-cream',
                isLocked && !isSelected && 'cursor-not-allowed',
                !isLocked && 'cursor-pointer'
              )}
            >
              <ModeDot
                mode={mode}
                className={cn(!isSelected && 'opacity-60')}
              />
              {captureModeLabels[mode]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
