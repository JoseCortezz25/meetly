import type { OnboardingStep } from '../types/onboarding-step.types';

/**
 * Mocked onboarding content. Swap titles, descriptions, and images here
 * without touching hooks or components.
 */
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'record',
    title: 'Record any meeting',
    description:
      'Start a capture from the dashboard and pick your microphone, system audio, or both. Meetly records right in your browser — no installs, no plugins.'
  },
  {
    id: 'transcribe',
    title: 'Transcripts and AI notes, on-device',
    description:
      'When you stop recording, Meetly transcribes the audio and drafts summaries and action items for you. Everything runs locally with on-device AI.'
  },
  {
    id: 'browse',
    title: 'Find every meeting again',
    description:
      'Your recordings live on the dashboard. Open any meeting to revisit its transcript, AI notes, and action items whenever you need them.'
  },
  {
    id: 'privacy',
    title: 'Private by design',
    description:
      'Nothing leaves your device. Audio, transcripts, and notes are stored locally in your browser — no servers, no uploads, no accounts.'
  }
];
