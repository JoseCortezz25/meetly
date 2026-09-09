/**
 * Shared AI-notes preferences (persisted in localStorage). Lives in lib so
 * both the settings UI and the notes-generation service can read them without
 * a cross-domain import.
 */

import type { LanguageOption, ModelOption } from './transcription-settings';

export const NOTES_MODELS: ModelOption[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen2.5 1.5B',
    hint: 'Fastest, lightweight'
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B',
    hint: 'Balanced — recommended'
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    label: 'Gemma 2 2B',
    hint: 'Alternative, compact'
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    label: 'Qwen2.5 7B',
    hint: 'Best quality, heaviest download'
  }
];

export const DEFAULT_NOTES_MODEL_ID = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

const NOTES_MODEL_STORAGE_KEY = 'meetly.notes-model';

export const getNotesModelId = (): string => {
  if (typeof localStorage === 'undefined') return DEFAULT_NOTES_MODEL_ID;
  const stored = localStorage.getItem(NOTES_MODEL_STORAGE_KEY);
  const isValid = NOTES_MODELS.some(option => option.id === stored);
  return isValid ? (stored as string) : DEFAULT_NOTES_MODEL_ID;
};

export const setNotesModelId = (model: string): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(NOTES_MODEL_STORAGE_KEY, model);
};

export const notesModelLabel = (model: string): string =>
  NOTES_MODELS.find(option => option.id === model)?.label ?? model;

/** "auto" keeps the transcript's own language; any code forces that language. */
export const NOTES_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Same as transcript' },
  { code: 'es', label: 'Spanish' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' }
];

export const DEFAULT_NOTES_LANGUAGE = 'auto';

const NOTES_LANGUAGE_STORAGE_KEY = 'meetly.notes-language';

export const getNotesLanguage = (): string => {
  if (typeof localStorage === 'undefined') return DEFAULT_NOTES_LANGUAGE;
  const stored = localStorage.getItem(NOTES_LANGUAGE_STORAGE_KEY);
  const isValid = NOTES_LANGUAGES.some(option => option.code === stored);
  return isValid ? (stored as string) : DEFAULT_NOTES_LANGUAGE;
};

export const setNotesLanguage = (code: string): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(NOTES_LANGUAGE_STORAGE_KEY, code);
};

export const notesLanguageLabel = (code: string): string =>
  NOTES_LANGUAGES.find(option => option.code === code)?.label ?? code;

/* -------------------------------------------------------------------------- *
 * Remote notes engine (Vercel AI SDK) — optional API-key providers.
 *
 * By default notes are generated fully on-device (WebLLM). A user can instead
 * choose a hosted provider and paste their own API key. Everything — the key
 * included — lives in localStorage and calls run from the browser; nothing is
 * sent to an app server. The key is therefore stored in plain text in this
 * browser: acceptable for a local-first, bring-your-own-key tool, but it is a
 * deliberate tradeoff, not an oversight.
 * -------------------------------------------------------------------------- */

export type NotesEngineMode = 'local' | 'remote';

export type RemoteNotesProviderId = 'openai' | 'google' | 'opencode-zen';

export type RemoteNotesProvider = {
  id: RemoteNotesProviderId;
  label: string;
  /** Where the user obtains an API key. */
  apiKeyUrl: string;
  /**
   * OpenAI-compatible base URL. Only set for providers wired through the
   * openai-compatible adapter (OpenCode Zen); native providers omit it.
   */
  baseURL?: string;
  /** Curated fast, current models only — no legacy models. */
  models: ModelOption[];
};

export const REMOTE_NOTES_PROVIDERS: RemoteNotesProvider[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    models: [
      {
        id: 'gpt-5.6-luna',
        label: 'GPT-5.6 Luna',
        hint: 'Fastest, lowest cost'
      },
      { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra', hint: 'Balanced' }
    ]
  },
  {
    id: 'google',
    label: 'Google',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    models: [
      {
        id: 'gemini-3.6-flash',
        label: 'Gemini 3.6 Flash',
        hint: 'Newest, recommended'
      },
      { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', hint: 'Fast' },
      {
        id: 'gemini-3.5-flash-lite',
        label: 'Gemini 3.5 Flash Lite',
        hint: 'Fastest, cheapest'
      }
    ]
  },
  {
    id: 'opencode-zen',
    label: 'OpenCode Zen',
    apiKeyUrl: 'https://opencode.ai/zen',
    baseURL: 'https://opencode.ai/zen/v1',
    models: [
      { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna', hint: 'Fast, low cost' },
      {
        id: 'gemini-3.5-flash-lite',
        label: 'Gemini 3.5 Flash Lite',
        hint: 'Fastest, cheapest'
      },
      {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        hint: 'Fast, very cheap'
      }
    ]
  }
];

export const DEFAULT_NOTES_ENGINE_MODE: NotesEngineMode = 'local';
export const DEFAULT_REMOTE_NOTES_PROVIDER: RemoteNotesProviderId = 'openai';

const NOTES_ENGINE_MODE_STORAGE_KEY = 'meetly.notes-engine-mode';
const REMOTE_PROVIDER_STORAGE_KEY = 'meetly.notes-remote-provider';
const REMOTE_MODEL_STORAGE_PREFIX = 'meetly.notes-remote-model.';
const REMOTE_API_KEY_STORAGE_PREFIX = 'meetly.notes-api-key.';

export const findRemoteProvider = (
  id: RemoteNotesProviderId
): RemoteNotesProvider =>
  REMOTE_NOTES_PROVIDERS.find(provider => provider.id === id) ??
  REMOTE_NOTES_PROVIDERS[0];

export const getNotesEngineMode = (): NotesEngineMode => {
  if (typeof localStorage === 'undefined') return DEFAULT_NOTES_ENGINE_MODE;
  const stored = localStorage.getItem(NOTES_ENGINE_MODE_STORAGE_KEY);
  return stored === 'remote' ? 'remote' : DEFAULT_NOTES_ENGINE_MODE;
};

export const setNotesEngineMode = (mode: NotesEngineMode): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(NOTES_ENGINE_MODE_STORAGE_KEY, mode);
};

export const getRemoteNotesProvider = (): RemoteNotesProviderId => {
  if (typeof localStorage === 'undefined') return DEFAULT_REMOTE_NOTES_PROVIDER;
  const stored = localStorage.getItem(REMOTE_PROVIDER_STORAGE_KEY);
  const isValid = REMOTE_NOTES_PROVIDERS.some(p => p.id === stored);
  return isValid
    ? (stored as RemoteNotesProviderId)
    : DEFAULT_REMOTE_NOTES_PROVIDER;
};

export const setRemoteNotesProvider = (id: RemoteNotesProviderId): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(REMOTE_PROVIDER_STORAGE_KEY, id);
};

/** Selected model for a provider, defaulting to its first (fastest) model. */
export const getRemoteNotesModel = (id: RemoteNotesProviderId): string => {
  const provider = findRemoteProvider(id);
  const fallback = provider.models[0].id;
  if (typeof localStorage === 'undefined') return fallback;
  const stored = localStorage.getItem(REMOTE_MODEL_STORAGE_PREFIX + id);
  const isValid = provider.models.some(model => model.id === stored);
  return isValid ? (stored as string) : fallback;
};

export const setRemoteNotesModel = (
  id: RemoteNotesProviderId,
  model: string
): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(REMOTE_MODEL_STORAGE_PREFIX + id, model);
};

/** API key for a provider (kept per-provider so switching never loses a key). */
export const getRemoteNotesApiKey = (id: RemoteNotesProviderId): string => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(REMOTE_API_KEY_STORAGE_PREFIX + id) ?? '';
};

export const setRemoteNotesApiKey = (
  id: RemoteNotesProviderId,
  apiKey: string
): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(REMOTE_API_KEY_STORAGE_PREFIX + id, apiKey);
};

export type ResolvedNotesEngine =
  | { mode: 'local' }
  | {
      mode: 'remote';
      provider: RemoteNotesProvider;
      model: string;
      apiKey: string;
    };

/** Single source of truth the generation service reads before each run. */
export const getResolvedNotesEngine = (): ResolvedNotesEngine => {
  if (getNotesEngineMode() === 'local') return { mode: 'local' };
  const providerId = getRemoteNotesProvider();
  return {
    mode: 'remote',
    provider: findRemoteProvider(providerId),
    model: getRemoteNotesModel(providerId),
    apiKey: getRemoteNotesApiKey(providerId)
  };
};
