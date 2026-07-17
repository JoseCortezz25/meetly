'use client';

import {
  TRANSCRIPTION_LANGUAGES,
  TRANSCRIPTION_MODELS
} from '@/lib/transcription-settings';
import { NOTES_MODELS } from '@/lib/notes-settings';
import { useTranscriptionSettings } from '../../hooks/use-transcription-settings';
import { useNotesSettings } from '../../hooks/use-notes-settings';
import { OptionChips } from '../molecules/option-chips';
import { settingsMessages } from '../../messages';

const LANGUAGE_OPTIONS = TRANSCRIPTION_LANGUAGES.map(option => ({
  id: option.code,
  label: option.label
}));

export const SettingsPanel = () => {
  const {
    language,
    setLanguage,
    model: transcriptionModel,
    setModel: setTranscriptionModel
  } = useTranscriptionSettings();
  const { model: notesModel, setModel: setNotesModel } = useNotesSettings();

  const { transcription, notes } = settingsMessages;

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

      <div className="flex max-w-[640px] flex-col gap-5">
        <div className="border-line bg-ink-2 rounded-[16px] border p-6">
          <p className="text-sand-2 mb-4 text-[12px] font-semibold tracking-[1px] uppercase">
            {transcription.title}
          </p>

          <h2 className="text-cream text-[15px] font-semibold">
            {transcription.languageLabel}
          </h2>
          <p className="text-sand mt-1 mb-4 text-[13.5px] leading-[1.5]">
            {transcription.languageHint}
          </p>
          <OptionChips
            options={LANGUAGE_OPTIONS}
            value={language}
            ariaLabel={transcription.languageLabel}
            onChange={setLanguage}
          />

          <hr className="border-line my-6" />

          <h2 className="text-cream text-[15px] font-semibold">
            {transcription.modelLabel}
          </h2>
          <p className="text-sand mt-1 mb-4 text-[13.5px] leading-[1.5]">
            {transcription.modelHint}
          </p>
          <OptionChips
            options={TRANSCRIPTION_MODELS}
            value={transcriptionModel}
            ariaLabel={transcription.modelLabel}
            onChange={id =>
              setTranscriptionModel(id as typeof transcriptionModel)
            }
          />
        </div>

        <div className="border-line bg-ink-2 rounded-[16px] border p-6">
          <p className="text-sand-2 mb-4 text-[12px] font-semibold tracking-[1px] uppercase">
            {notes.title}
          </p>

          <h2 className="text-cream text-[15px] font-semibold">
            {notes.modelLabel}
          </h2>
          <p className="text-sand mt-1 mb-4 text-[13.5px] leading-[1.5]">
            {notes.modelHint}
          </p>
          <OptionChips
            options={NOTES_MODELS}
            value={notesModel}
            ariaLabel={notes.modelLabel}
            onChange={setNotesModel}
          />
        </div>
      </div>
    </section>
  );
};
