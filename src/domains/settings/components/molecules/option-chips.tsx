'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChipOption = {
  id: string;
  label: string;
  hint?: string;
};

type OptionChipsProps = {
  options: ChipOption[];
  value: string;
  ariaLabel: string;
  onChange: (id: string) => void;
};

export const OptionChips = ({
  options,
  value,
  ariaLabel,
  onChange
}: OptionChipsProps) => {
  const activeHint = options.find(option => option.id === value)?.hint;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
        {options.map(option => {
          const isActive = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors [&_svg]:size-[15px]',
                isActive
                  ? 'bg-cream text-ink border-transparent'
                  : 'border-line-2 text-sand hover:border-cream hover:text-cream'
              )}
            >
              {isActive && <Check />}
              {option.label}
            </button>
          );
        })}
      </div>
      {activeHint && (
        <p className="text-sand-2 mt-3 text-[12.5px]">{activeHint}</p>
      )}
    </div>
  );
};
