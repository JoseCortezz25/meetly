import type { AudioMode, MeetingStatus } from './types/meeting.types';
import type { NotesErrorCode } from './types/meeting-detail.types';
import type { ChannelKind, RecordingErrorCode } from './types/recording.types';

export const dashboardMessages = {
  // Curated phrase pools per time slot; one is picked per visit. Keeping the
  // copy here (not in components) follows the domain message-map convention.
  greeting: {
    night: [
      'Still up?',
      'Burning the midnight oil',
      'The quiet hours',
      'Late-night session'
    ],
    dawn: ['Up early', 'Rise and shine', 'Early start', 'Good early morning'],
    morning: ['Good morning', 'Morning', 'Fresh start', 'Ready for the day?'],
    afternoon: [
      'Good afternoon',
      'Afternoon',
      'Midday momentum',
      'Hope your day is going well'
    ],
    evening: [
      'Good evening',
      'Evening',
      'Winding down?',
      'Hope you had a good day'
    ]
  },
  searchPlaceholder: 'Search meetings…',
  hero: {
    title: 'Start a quick meeting',
    description:
      'Capture audio locally and turn it into a transcript and AI notes — all on your device.',
    recordHint: 'Tap to record',
    recordAriaLabel: 'Start recording'
  },
  recent: {
    title: 'Recent meetings',
    viewAll: 'View all',
    empty: 'No recordings yet. Start one to see it here.'
  }
} as const;

export const audioModeLabels: Record<AudioMode, string> = {
  mic: 'Microphone',
  sys: 'System audio',
  mix: 'Mixed'
};

export const meetingStatusLabels: Record<MeetingStatus, string> = {
  ready: 'Ready',
  processing: 'Processing',
  recording: 'Recording'
};

export const recordingMessages = {
  backToDashboard: 'Back to dashboard',
  namePlaceholder: 'Untitled meeting',
  nameAriaLabel: 'Meeting name',
  idle: {
    eyebrow: 'Ready when you are',
    title: 'Choose what to capture',
    description:
      'Pick a source, then start recording. You can preview your channels below before anything is captured.',
    channelsPlaceholder: 'Select a capture mode to preview your channels.',
    start: 'Start recording',
    requesting: 'Requesting access…',
    startDisabledHint: 'Select a mode to begin'
  },
  errors: {
    permissionDenied:
      'Capture permission was denied. Allow access and try again.',
    noSystemAudio:
      'No system audio was shared. On macOS, share a browser tab and enable "Share tab audio".',
    unsupported: 'Audio recording is not supported in this browser.',
    sourceEnded: 'The capture source ended before there was anything to save.',
    unknown: 'Something went wrong starting the recording. Please try again.'
  },
  autoStop: {
    stoppedNotice: 'Recording stopped on its own — the captured source ended.',
    channelEndedWarning: (channelName: string) =>
      `${channelName} ended — still recording the other channel.`
  },
  result: {
    title: 'Recording saved',
    description:
      'Preview your capture, then download it. Local transcription comes next.',
    download: 'Download .webm',
    recordAgain: 'Record again'
  },
  status: {
    recording: 'Recording',
    paused: 'Paused'
  },
  controls: {
    muteMic: 'Mute mic',
    unmuteMic: 'Unmute mic',
    muteSystem: 'Mute system',
    unmuteSystem: 'Unmute system',
    pause: 'Pause',
    resume: 'Resume',
    stopAndSave: 'Stop & save'
  },
  channel: {
    mute: 'Mute',
    unmute: 'Unmute'
  },
  hint: 'On macOS, "system audio" captures a shared browser tab (e.g. Meet, Teams web) — not native apps.',
  channelAria: {
    muteMic: 'Mute microphone',
    unmuteMic: 'Unmute microphone',
    muteSystem: 'Mute system audio',
    unmuteSystem: 'Unmute system audio'
  }
} as const;

export const recordingErrorLabels: Record<RecordingErrorCode, string> = {
  'permission-denied': recordingMessages.errors.permissionDenied,
  'no-system-audio': recordingMessages.errors.noSystemAudio,
  unsupported: recordingMessages.errors.unsupported,
  'source-ended': recordingMessages.errors.sourceEnded,
  unknown: recordingMessages.errors.unknown
};

/** Mode labels for the recording segmented control (differs from the dashboard chips). */
export const captureModeLabels: Record<AudioMode, string> = {
  mic: 'Mic only',
  sys: 'System audio',
  mix: 'Mixed'
};

export const notesListMessages = {
  title: 'Meeting notes',
  description: 'Every meeting you have recorded, with its AI notes.',
  empty: 'No meeting notes yet.',
  pendingNotes: 'Transcript ready · AI notes pending',
  keyPointCount: (count: number) =>
    `${count} key point${count === 1 ? '' : 's'}`,
  actionItemCount: (count: number) =>
    `${count} action item${count === 1 ? '' : 's'}`
} as const;

export const meetingDetailMessages = {
  backToDashboard: 'Back to dashboard',
  tabs: {
    notes: 'AI Notes',
    transcript: 'Transcript'
  },
  sections: {
    summary: 'Summary',
    keyPoints: 'Key points',
    actionItems: 'Action items',
    decisions: 'Decisions'
  },
  actionItemMeta: {
    owner: 'Owner:'
  },
  actions: {
    regenerate: 'Regenerate notes',
    export: 'Export',
    exportNotes: 'Notes (.md)',
    exportTranscript: 'Transcript (.md)',
    downloadAudio: 'Audio (.webm)',
    delete: 'Delete meeting',
    deleteConfirm: 'Delete this meeting?',
    deleteConfirmYes: 'Delete',
    deleteCancel: 'Cancel',
    editTitle: 'Rename meeting',
    renamePlaceholder: 'Meeting name',
    renameSave: 'Save name',
    renameCancel: 'Cancel rename'
  },
  sidebar: {
    details: 'Details',
    participants: 'Participants',
    duration: 'Duration',
    channels: 'Channels',
    model: 'Model',
    language: 'Language'
  },
  transcriptCopy: {
    label: 'Copy transcript',
    copied: 'Copied',
    error: 'Copy failed',
    ariaLabel: 'Copy transcript to clipboard'
  },
  transcriptEmpty: 'No transcript for this meeting yet.',
  notesEmpty: 'AI notes for this meeting have not been generated yet.',
  loading: 'Loading meeting…',
  notFound: 'This meeting could not be found.'
} as const;

export const processingMessages = {
  title: 'Processing your recording',
  stages: {
    loading: 'Loading transcription model…',
    decoding: 'Decoding audio…',
    transcribing: 'Transcribing on your device…',
    done: 'Finishing up…'
  },
  firstRunHint:
    'The first run downloads the model once, then it works offline.',
  liveHeading: 'Live transcript',
  error: {
    title: 'Transcription failed',
    description:
      'We could not transcribe this recording. You can still download the audio.',
    download: 'Download .webm',
    retry: 'Try again',
    recordAgain: 'Record again'
  }
} as const;

export const notesGeneratorMessages = {
  title: 'Generate AI notes',
  description:
    'Summarize this meeting into notes, fully on your device. The first run downloads the model once.',
  cta: 'Generate notes',
  loadingModel: 'Downloading model…',
  generating: 'Reading the transcript…',
  generatingChunk: (current: number, total: number) =>
    `Summarizing part ${current} of ${total}…`,
  combining: 'Combining notes…',
  previewHeading: 'Draft',
  errors: {
    noWebgpu:
      'AI notes need a WebGPU browser (Chrome 113+ or Edge). This browser is not supported.',
    contextOverflow:
      'This transcript is too long for the on-device model, even after splitting it into sections. Try a different model in Settings.',
    apiKeyMissing:
      'Add your provider API key in Settings to generate notes with a hosted model.',
    providerError:
      'The AI provider rejected the request. Check your API key and model in Settings, then try again.',
    unknown: 'Could not generate notes. Please try again.'
  },
  retry: 'Try again',
  cancel: 'Keep current notes'
} as const;

export const notesErrorLabels: Record<NotesErrorCode, string> = {
  'no-webgpu': notesGeneratorMessages.errors.noWebgpu,
  'context-overflow': notesGeneratorMessages.errors.contextOverflow,
  'api-key-missing': notesGeneratorMessages.errors.apiKeyMissing,
  'provider-error': notesGeneratorMessages.errors.providerError,
  unknown: notesGeneratorMessages.errors.unknown
};

/** Defaults applied to a freshly recorded meeting before the user edits it. */
export const recordedMeetingDefaults = {
  title: (dateLabel: string, timeLabel: string) =>
    `Recording · ${dateLabel} ${timeLabel}`,
  tag: 'Recording',
  language: 'Auto-detected'
} as const;

/**
 * Per-channel labels. `title` is static; `sourcePlaceholder` shows in the idle
 * preview, replaced by the real device/track label once capture starts.
 */
export const channelMeta: Record<
  ChannelKind,
  { title: string; sourcePlaceholder: string }
> = {
  mic: { title: 'Your mic', sourcePlaceholder: 'Microphone' },
  sys: { title: 'System audio', sourcePlaceholder: 'Shared audio' }
};

/**
 * Formats a live peak level for display (e.g. -19 → "-19 dB"). `null` means no
 * active capture yet, shown as a neutral placeholder.
 */
export const formatPeakDb = (peakDb: number | null): string =>
  peakDb === null ? '— dB' : `${Math.round(peakDb)} dB`;
