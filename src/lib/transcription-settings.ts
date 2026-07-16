/**
 * Shared transcription preferences (persisted in localStorage). Lives in lib so
 * both the settings UI and the meetings recording flow can read it without a
 * cross-domain import.
 */

export type LanguageOption = {
  /** BCP-47 code, or "auto" for model auto-detection. */
  code: string;
  label: string;
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
