'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type ApiKeyFieldProps = {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: string) => void;
};

export const ApiKeyField = ({
  value,
  placeholder,
  ariaLabel,
  onChange
}: ApiKeyFieldProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="border-line bg-ink focus-within:border-line-2 flex items-center gap-2 rounded-full border px-4 py-2.5">
      <input
        type={isVisible ? 'text' : 'password'}
        value={value}
        aria-label={ariaLabel}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={event => onChange(event.target.value)}
        className="text-cream placeholder:text-sand w-full bg-transparent font-mono text-[13px] focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setIsVisible(current => !current)}
        aria-label={isVisible ? 'Hide API key' : 'Show API key'}
        aria-pressed={isVisible}
        className={cn('text-sand hover:text-cream shrink-0 transition-colors')}
      >
        {isVisible ? (
          <EyeOff className="size-[15px]" />
        ) : (
          <Eye className="size-[15px]" />
        )}
      </button>
    </div>
  );
};
