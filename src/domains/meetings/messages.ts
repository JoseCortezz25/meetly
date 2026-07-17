import type { AudioMode, MeetingStatus } from './types/meeting.types';
import type { ChannelKind, RecordingErrorCode } from './types/recording.types';

export const dashboardMessages = {
  greeting: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening'
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
    unknown: 'Something went wrong starting the recording. Please try again.'
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
  previewHeading: 'Draft',
  errors: {
    noWebgpu:
      'AI notes need a WebGPU browser (Chrome 113+ or Edge). This browser is not supported.',
    unknown: 'Could not generate notes. Please try again.'
  },
  retry: 'Try again'
} as const;

export const notesErrorLabels: Record<'no-webgpu' | 'unknown', string> = {
  'no-webgpu': notesGeneratorMessages.errors.noWebgpu,
  unknown: notesGeneratorMessages.errors.unknown
};

/** Defaults applied to a freshly recorded meeting before the user edits it. */
export const recordedMeetingDefaults = {
  title: (dateLabel: string, timeLabel: string) =>
    `Recording · ${dateLabel} ${timeLabel}`,
  tag: 'Recording',
  language: 'Auto-detected'
} as const;

/** Static device metadata per channel (mocked until real capture is wired). */
export const channelMeta: Record<
  ChannelKind,
  { title: string; source: string; peakDb: number }
> = {
  mic: { title: 'Your mic', source: 'MacBook Pro Microphone', peakDb: -19 },
  sys: {
    title: 'System audio',
    source: 'Shared tab · Google Meet',
    peakDb: -32
  }
};

/** Formats a peak level reading for display (e.g. -19 → "-19 dB"). */
export const formatPeakDb = (peakDb: number): string => `${peakDb} dB`;
