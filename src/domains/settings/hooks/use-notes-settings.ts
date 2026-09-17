'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_NOTES_ENGINE_MODE,
  DEFAULT_NOTES_LANGUAGE,
  DEFAULT_NOTES_MODEL_ID,
  DEFAULT_REMOTE_NOTES_PROVIDER,
  getNotesEngineMode,
  getNotesLanguage,
  getNotesModelId,
  getRemoteNotesApiKey,
  getRemoteNotesModel,
  getRemoteNotesProvider,
  migrateLegacyOpenCodeStorage,
  setNotesEngineMode,
  setNotesLanguage,
  setNotesModelId,
  setRemoteNotesApiKey,
  setRemoteNotesModel,
  setRemoteNotesProvider,
  type NotesEngineMode,
  type RemoteNotesProviderId
} from '@/lib/notes-settings';

export const useNotesSettings = () => {
  // Start from defaults on both server and client, then hydrate from storage in
  // an effect to avoid a hydration mismatch.
  const [model, setModelState] = useState<string>(DEFAULT_NOTES_MODEL_ID);
  const [language, setLanguageState] = useState<string>(DEFAULT_NOTES_LANGUAGE);
  const [mode, setModeState] = useState<NotesEngineMode>(
    DEFAULT_NOTES_ENGINE_MODE
  );
  const [provider, setProviderState] = useState<RemoteNotesProviderId>(
    DEFAULT_REMOTE_NOTES_PROVIDER
  );
  const [remoteModel, setRemoteModelState] = useState<string>('');
  const [apiKey, setApiKeyState] = useState<string>('');

  useEffect(() => {
    // Move any key saved under the former OpenCode Zen id to the new Go id first.
    migrateLegacyOpenCodeStorage();
    setModelState(getNotesModelId());
    setLanguageState(getNotesLanguage());
    const storedMode = getNotesEngineMode();
    const storedProvider = getRemoteNotesProvider();
    setModeState(storedMode);
    setProviderState(storedProvider);
    setRemoteModelState(getRemoteNotesModel(storedProvider));
    setApiKeyState(getRemoteNotesApiKey(storedProvider));
  }, []);

  const setModel = (id: string) => {
    setNotesModelId(id);
    setModelState(id);
  };

  const setLanguage = (code: string) => {
    setNotesLanguage(code);
    setLanguageState(code);
  };

  const setMode = (next: NotesEngineMode) => {
    setNotesEngineMode(next);
    setModeState(next);
  };

  // Switching provider re-reads that provider's own saved model + key, so a key
  // entered for one provider is never lost by visiting another.
  const setProvider = (id: RemoteNotesProviderId) => {
    setRemoteNotesProvider(id);
    setProviderState(id);
    setRemoteModelState(getRemoteNotesModel(id));
    setApiKeyState(getRemoteNotesApiKey(id));
  };

  const setRemoteModel = (id: string) => {
    setRemoteNotesModel(provider, id);
    setRemoteModelState(id);
  };

  const setApiKey = (key: string) => {
    setRemoteNotesApiKey(provider, key);
    setApiKeyState(key);
  };

  return {
    model,
    setModel,
    language,
    setLanguage,
    mode,
    setMode,
    provider,
    setProvider,
    remoteModel,
    setRemoteModel,
    apiKey,
    setApiKey
  };
};
