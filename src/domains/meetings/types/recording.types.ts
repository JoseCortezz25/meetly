/** Lifecycle of the in-view recording session.
 *  - idle: setup state where the user picks a capture mode
 *  - requesting: waiting for device/display permission
 *  - recording / paused: an active capture session
 *  - processing: capture finished, transcribing + persisting on-device
 *  - saved: meeting persisted, navigating to its detail view */
export type RecordingStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'saved';

/** A single capture source. A meeting can capture one or both. */
export type ChannelKind = 'mic' | 'sys';

/** Per-channel mute state. */
export type ChannelMuteState = Record<ChannelKind, boolean>;

/** Live AnalyserNode per channel, or null when no capture is running. */
export type ChannelAnalysers = Record<ChannelKind, AnalyserNode | null>;

/** Elapsed time split into display parts for the timecode. */
export type Timecode = {
  minutes: string;
  seconds: string;
  centis: string;
};

/** Why a capture attempt failed — drives a user-facing message. */
export type RecordingErrorCode =
  | 'permission-denied'
  | 'no-system-audio'
  | 'unsupported'
  | 'unknown';

/** The output of a finished recording session. */
export type RecordingResult = {
  blob: Blob;
  /** Object URL for the blob — must be revoked when discarded. */
  url: string;
  mimeType: string;
  /** Duration label captured at stop time, e.g. "04:12". */
  durationLabel: string;
};

/** Phase of the on-device transcription pipeline. */
export type TranscriptionStage =
  | 'loading'
  | 'decoding'
  | 'transcribing'
  | 'done';

/** Progress update emitted while transcribing. */
export type TranscriptionProgress = {
  stage: TranscriptionStage;
  /** 0–1 within the current stage. */
  progress: number;
};
