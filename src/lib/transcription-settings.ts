/**
 * Shared transcription preferences (persisted in localStorage). Lives in lib so
 * both the settings UI and the meetings recording flow can read it without a
 * cross-domain import.
 */

import type { ASRModel } from 'browser-whisper';

export type LanguageOption = {
  /** BCP-47 code, or "auto" for model auto-detection. */
  code: string;
  label: string;
};

/** A selectable on-device model, shared by the transcription and notes settings. */
export type ModelOption<TId extends string = string> = {
  id: TId;
  label: string;
  hint: string;
};

export const TRANSCRIPTION_LANGUAGES: LanguageOption[] = [
  { code: 'es', label: 'Spanish' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'auto', label: 'Auto-detect' }
];

export const DEFAULT_LANGUAGE_CODE = 'es';

const STORAGE_KEY = 'meetly.transcription-language';

export const getTranscriptionLanguage = (): string => {
  if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE_CODE;
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANGUAGE_CODE;
};

export const setTranscriptionLanguage = (code: string): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, code);
};

export const languageLabel = (code: string): string =>
  TRANSCRIPTION_LANGUAGES.find(option => option.code === code)?.label ?? code;

/** Maps a stored code to the value browser-whisper expects (undefined = auto). */
export const toWhisperLanguage = (code: string): string | undefined =>
  code === 'auto' ? undefined : code;

export const TRANSCRIPTION_MODELS: ModelOption<ASRModel>[] = [
  {
    id: 'whisper-tiny',
    label: 'Whisper Tiny',
    hint: 'Fastest, least accurate'
  },
  { id: 'whisper-base', label: 'Whisper Base', hint: 'Balanced — recommended' },
  {
    id: 'whisper-small',
    label: 'Whisper Small',
    hint: 'More accurate, slower'
  },
  {
    id: 'whisper-large-v3-turbo',
    label: 'Whisper Large v3 Turbo',
    hint: 'Best accuracy, heaviest download'
  }
];

export const DEFAULT_TRANSCRIPTION_MODEL: ASRModel = 'whisper-base';

const MODEL_STORAGE_KEY = 'meetly.transcription-model';

export const getTranscriptionModel = (): ASRModel => {
  if (typeof localStorage === 'undefined') return DEFAULT_TRANSCRIPTION_MODEL;
  const stored = localStorage.getItem(MODEL_STORAGE_KEY);
  const isValid = TRANSCRIPTION_MODELS.some(option => option.id === stored);
  return isValid ? (stored as ASRModel) : DEFAULT_TRANSCRIPTION_MODEL;
};

export const setTranscriptionModel = (model: ASRModel): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(MODEL_STORAGE_KEY, model);
};

export const transcriptionModelLabel = (model: string): string =>
  TRANSCRIPTION_MODELS.find(option => option.id === model)?.label ?? model;
