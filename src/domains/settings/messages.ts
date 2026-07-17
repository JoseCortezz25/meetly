export const settingsMessages = {
  title: 'Settings',
  description:
    'Configure how Meetly captures, transcribes, and summarizes your meetings.',
  transcription: {
    title: 'Transcription',
    languageLabel: 'Language',
    languageHint:
      'The language the on-device model expects. Picking it improves accuracy; Auto-detect also works.',
    modelLabel: 'Model',
    modelHint:
      'The on-device speech-to-text model. Larger models transcribe more accurately but take longer to download and run.'
  },
  notes: {
    title: 'AI Notes',
    modelLabel: 'Model',
    modelHint:
      'The on-device language model that writes your meeting notes. Larger models produce better notes but need more memory and time.'
  }
} as const;
