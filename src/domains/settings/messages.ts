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
    apiKeyStored: 'Stored in this browser only.',
    // Provider + model display copy — kept here (domain message map) rather than
    // in the provider config under lib/, per the text-management convention.
    providers: {
      openai: 'OpenAI',
      google: 'Google',
      'opencode-go': 'OpenCode Go'
    },
    models: {
      'gpt-5.6-luna': { label: 'GPT-5.6 Luna', hint: 'Fastest, lowest cost' },
      'gpt-5.6-terra': { label: 'GPT-5.6 Terra', hint: 'Balanced' },
      'gemini-3.6-flash': {
        label: 'Gemini 3.6 Flash',
        hint: 'Newest, recommended'
      },
      'gemini-3.5-flash': { label: 'Gemini 3.5 Flash', hint: 'Fast' },
      'gemini-3.5-flash-lite': {
        label: 'Gemini 3.5 Flash Lite',
        hint: 'Fastest, cheapest'
      },
      'deepseek-v4.1-flash': {
        label: 'DeepSeek V4.1 Flash',
        hint: 'Fast, very cheap'
      },
      'glm-5.3-flash': { label: 'GLM 5.3 Flash', hint: 'Fast' },
      'qwen3.8-flash': { label: 'Qwen 3.8 Flash', hint: 'Fast, low cost' }
    } as Record<string, { label: string; hint: string }>
  }
} as const;
