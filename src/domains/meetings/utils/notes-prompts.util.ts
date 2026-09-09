/**
 * System prompts for the notes-generation passes. Pure functions so the
 * language instruction can be unit-tested without touching WebLLM.
 */

import { notesLanguageLabel } from '@/lib/notes-settings';

const NOTES_FORMAT = [
  'Output ONLY the four sections below, with these exact headers and nothing else:',
  '',
  '## Summary',
  '<one short paragraph, 2-4 sentences>',
  '',
  '## Key points',
  '- <point>',
  '',
  '## Action items',
  '- <task> :: <owner or -> :: <due or ->',
  '',
  '## Decisions',
  '- <decision>',
  '',
  'Rules: do not invent details that are not in the transcript. If a section has no content, write "- none".'
].join('\n');

export type NotesSystemPrompts = {
  /** Fast path: the whole transcript summarized in one pass. */
  single: string;
  /** Map phase: notes for ONE portion of a longer transcript. */
  chunk: string;
  /** Reduce phase: merge partial notes from consecutive portions. */
  merge: string;
};

/**
 * Language instruction shared by every pass. "auto" preserves the source
 * language of the given subject; any other code forces that language.
 */
export const buildLanguageInstruction = (
  language: string,
  subject: 'transcript' | 'partial notes'
): string =>
  language === 'auto'
    ? `Write in the SAME LANGUAGE as the ${subject}.`
    : `Write the notes in ${notesLanguageLabel(language)}, regardless of the transcript language.`;

/** Builds the three system prompts for the notes language chosen in Settings. */
export const buildNotesSystemPrompts = (
  language: string
): NotesSystemPrompts => ({
  single: [
    'You are a meeting-notes assistant. Read the meeting transcript and produce concise, factual notes.',
    buildLanguageInstruction(language, 'transcript'),
    NOTES_FORMAT
  ].join('\n'),
  chunk: [
    'You are a meeting-notes assistant. You will receive ONE portion of a longer meeting transcript.',
    'Produce concise, factual notes covering ONLY this portion. Be brief — these notes will be merged with notes from the other portions later.',
    buildLanguageInstruction(language, 'transcript'),
    NOTES_FORMAT
  ].join('\n'),
  merge: [
    'You are a meeting-notes assistant. You will receive partial meeting notes taken from consecutive portions of ONE meeting.',
    'Combine them into a single set of notes: merge overlapping items, remove duplicates, and keep every distinct point.',
    buildLanguageInstruction(language, 'partial notes'),
    NOTES_FORMAT
  ].join('\n')
});
