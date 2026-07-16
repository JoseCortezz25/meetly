'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRANSCRIPTION_LANGUAGES } from '@/lib/transcription-settings';
import { useTranscriptionSettings } from '../../hooks/use-transcription-settings';
import { settingsMessages } from '../../messages';

export const SettingsPanel = () => {
  const { language, setLanguage } = useTranscriptionSettings();

  return (
    <section>
      <div className="mb-8">
        <h1 className="font-display text-cream text-[32px] font-medium tracking-[-0.5px]">
          {settingsMessages.title}
        </h1>
        <p className="text-sand mt-1.5 text-[14.5px]">
          {settingsMessages.description}
        </p>
      </div>

      <div className="border-line bg-ink-2 max-w-[640px] rounded-[16px] border p-6">
        <p className="text-sand-2 mb-1 text-[12px] font-semibold tracking-[1px] uppercase">
          {settingsMessages.transcription.title}
        </p>
        <h2 className="text-cream text-[15px] font-semibold">
          {settingsMessages.transcription.languageLabel}
        </h2>
        <p className="text-sand mt-1 text-[13.5px] leading-[1.5]">
          {settingsMessages.transcription.languageHint}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {TRANSCRIPTION_LANGUAGES.map(option => {
            const isActive = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setLanguage(option.code)}
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
      </div>
    </section>
  );
};
