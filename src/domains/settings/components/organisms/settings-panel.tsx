'use client';

import {
  TRANSCRIPTION_LANGUAGES,
  TRANSCRIPTION_MODELS
} from '@/lib/transcription-settings';
import {
  NOTES_LANGUAGES,
  NOTES_MODELS,
  REMOTE_NOTES_PROVIDERS,
  findRemoteProvider,
  type NotesEngineMode,
  type RemoteNotesProviderId
} from '@/lib/notes-settings';
import { useTranscriptionSettings } from '../../hooks/use-transcription-settings';
import { useNotesSettings } from '../../hooks/use-notes-settings';
import { OptionChips } from '../molecules/option-chips';
import { ApiKeyField } from '../molecules/api-key-field';
import { settingsMessages } from '../../messages';

const LANGUAGE_OPTIONS = TRANSCRIPTION_LANGUAGES.map(option => ({
  id: option.code,
  label: option.label
}));

const NOTES_LANGUAGE_OPTIONS = NOTES_LANGUAGES.map(option => ({
  id: option.code,
  label: option.label
}));

const PROVIDER_OPTIONS = REMOTE_NOTES_PROVIDERS.map(provider => ({
  id: provider.id,
  label: settingsMessages.notes.providers[provider.id]
}));

export const SettingsPanel = () => {
  const {
    language,
    setLanguage,
    model: transcriptionModel,
    setModel: setTranscriptionModel
  } = useTranscriptionSettings();
  const {
    model: notesModel,
    setModel: setNotesModel,
    language: notesLanguage,
    setLanguage: setNotesLanguage,
    mode,
    setMode,
    provider,
    setProvider,
    remoteModel,
    setRemoteModel,
    apiKey,
    setApiKey
  } = useNotesSettings();

  const { transcription, notes } = settingsMessages;

  const ENGINE_OPTIONS = [
    { id: 'local', label: notes.engineOptions.local },
    { id: 'remote', label: notes.engineOptions.remote }
  ];

  const activeProvider = findRemoteProvider(provider);
  const remoteModelOptions = activeProvider.modelIds.map(id => ({
    id,
    label: notes.models[id]?.label ?? id,
    hint: notes.models[id]?.hint
  }));

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
            {notes.languageLabel}
          </h2>
          <p className="text-sand mt-1 mb-4 text-[13.5px] leading-[1.5]">
            {notes.languageHint}
          </p>
          <OptionChips
            options={NOTES_LANGUAGE_OPTIONS}
            value={notesLanguage}
            ariaLabel={notes.languageLabel}
            onChange={setNotesLanguage}
          />

          <hr className="border-line my-6" />

          <h2 className="text-cream text-[15px] font-semibold">
            {notes.engineLabel}
          </h2>
          <p className="text-sand mt-1 mb-4 text-[13.5px] leading-[1.5]">
            {notes.engineHint}
          </p>
          <OptionChips
            options={ENGINE_OPTIONS}
            value={mode}
            ariaLabel={notes.engineLabel}
            onChange={id => setMode(id as NotesEngineMode)}
          />

          <hr className="border-line my-6" />

          {mode === 'local' ? (
            <>
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
            </>
          ) : (
            <>
              <h2 className="text-cream text-[15px] font-semibold">
                {notes.providerLabel}
              </h2>
              <p className="text-sand mt-1 mb-4 text-[13.5px] leading-[1.5]">
                {notes.providerHint}
              </p>
              <OptionChips
                options={PROVIDER_OPTIONS}
                value={provider}
                ariaLabel={notes.providerLabel}
                onChange={id => setProvider(id as RemoteNotesProviderId)}
              />

              <h2 className="text-cream mt-6 text-[15px] font-semibold">
                {notes.remoteModelLabel}
              </h2>
              <p className="text-sand mt-1 mb-4 text-[13.5px] leading-[1.5]">
                {notes.remoteModelHint}
              </p>
              <OptionChips
                options={remoteModelOptions}
                value={remoteModel}
                ariaLabel={notes.remoteModelLabel}
                onChange={setRemoteModel}
              />

              <h2 className="text-cream mt-6 text-[15px] font-semibold">
                {notes.apiKeyLabel}
              </h2>
              <p className="text-sand mt-1 mb-3 text-[13.5px] leading-[1.5]">
                {notes.apiKeyStored}{' '}
                <a
                  href={activeProvider.apiKeyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cream underline underline-offset-2"
                >
                  {notes.apiKeyHint}
                </a>
              </p>
              <ApiKeyField
                value={apiKey}
                placeholder={notes.apiKeyPlaceholder}
                ariaLabel={`${notes.providers[activeProvider.id]} ${notes.apiKeyLabel}`}
                onChange={setApiKey}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
};
