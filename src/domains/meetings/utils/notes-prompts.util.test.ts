import { describe, expect, it } from '@jest/globals';
import {
  buildLanguageInstruction,
  buildNotesSystemPrompts
} from './notes-prompts.util';

describe('buildLanguageInstruction', () => {
  it('preserves the source language when set to auto', () => {
    expect(buildLanguageInstruction('auto', 'transcript')).toBe(
      'Write in the SAME LANGUAGE as the transcript.'
    );
    expect(buildLanguageInstruction('auto', 'partial notes')).toBe(
      'Write in the SAME LANGUAGE as the partial notes.'
    );
  });

  it('forces a specific language using its English label', () => {
    expect(buildLanguageInstruction('es', 'transcript')).toBe(
      'Write the notes in Spanish, regardless of the transcript language.'
    );
    expect(buildLanguageInstruction('de', 'partial notes')).toBe(
      'Write the notes in German, regardless of the transcript language.'
    );
  });

  it('falls back to the raw code for an unknown language', () => {
    expect(buildLanguageInstruction('xx', 'transcript')).toBe(
      'Write the notes in xx, regardless of the transcript language.'
    );
  });
});

describe('buildNotesSystemPrompts', () => {
  it('keeps the auto instructions per pass subject', () => {
    const prompts = buildNotesSystemPrompts('auto');

    expect(prompts.single).toContain(
      'Write in the SAME LANGUAGE as the transcript.'
    );
    expect(prompts.chunk).toContain(
      'Write in the SAME LANGUAGE as the transcript.'
    );
    expect(prompts.merge).toContain(
      'Write in the SAME LANGUAGE as the partial notes.'
    );
  });

  it('applies the same forced-language instruction to every pass', () => {
    const prompts = buildNotesSystemPrompts('pt');
    const instruction =
      'Write the notes in Portuguese, regardless of the transcript language.';

    expect(prompts.single).toContain(instruction);
    expect(prompts.chunk).toContain(instruction);
    expect(prompts.merge).toContain(instruction);
  });

  it('includes the shared output format in every prompt', () => {
    const prompts = buildNotesSystemPrompts('auto');

    for (const prompt of [prompts.single, prompts.chunk, prompts.merge]) {
      expect(prompt).toContain('## Summary');
      expect(prompt).toContain('## Key points');
      expect(prompt).toContain('## Action items');
      expect(prompt).toContain('## Decisions');
    }
  });
});
