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
    languageLabel: 'Language',
    languageHint:
      'The language the generated notes are written in. "Same as transcript" keeps the meeting\'s own language.',
    engineLabel: 'Engine',
    engineHint:
      'Generate notes on-device, or use a hosted provider with your own API key. Your key is stored only in this browser and calls run from your device — nothing is sent to a Meetly server.',
    engineOptions: {
      local: 'On-device',
      remote: 'API key'
    },
    modelLabel: 'Model',
    modelHint:
      'The on-device language model that writes your meeting notes. Larger models produce better notes but need more memory and time.',
    providerLabel: 'Provider',
    providerHint: 'Which hosted provider generates your notes.',
    remoteModelLabel: 'Model',
    remoteModelHint: 'Only fast, current models are offered.',
    apiKeyLabel: 'API key',
    apiKeyPlaceholder: 'Paste your API key',
    apiKeyHint: 'Get an API key',
    apiKeyStored: 'Stored in this browser only.'
  }
} as const;
