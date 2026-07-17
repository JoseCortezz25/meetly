/**
 * Shared AI-notes model preference (persisted in localStorage). Lives in lib so
 * both the settings UI and the notes-generation service can read it without a
 * cross-domain import.
 */

import type { ModelOption } from './transcription-settings';

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
