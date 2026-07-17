'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  getTranscriptionLanguage,
  getTranscriptionModel,
  languageLabel,
  toWhisperLanguage,
  transcriptionModelLabel
} from '@/lib/transcription-settings';
import {
  RecordingEngine,
  RecordingError
} from '../services/recording-engine.service';
import { transcribeRecording } from '../services/transcription.service';
import { saveMeeting } from '../services/meetings-repository.service';
import { recordedMeetingDefaults } from '../messages';
import type { AudioMode } from '../types/meeting.types';
import type {
  StoredMeeting,
  TranscriptTurn
} from '../types/meeting-detail.types';
import type {
  ChannelAnalysers,
  ChannelKind,
  ChannelMuteState,
  RecordingErrorCode,
  RecordingResult,
  RecordingStatus,
  Timecode,
  TranscriptionProgress
} from '../types/recording.types';

const TICK_INTERVAL_MS = 60;
const NO_ANALYSERS: ChannelAnalysers = { mic: null, sys: null };

type RecordingState = {
  mode: AudioMode | null;
  status: RecordingStatus;
  meetingName: string;
  muted: ChannelMuteState;
  elapsedMs: number;
  errorCode: RecordingErrorCode | null;
  result: RecordingResult | null;
  transcription: TranscriptionProgress | null;
  liveSegments: TranscriptTurn[];
  processingFailed: boolean;
  savedMeetingId: string | null;
};

type RecordingAction =
  | { type: 'selectMode'; mode: AudioMode }
  | { type: 'setName'; name: string }
  | { type: 'requesting' }
  | { type: 'started' }
  | { type: 'failed'; errorCode: RecordingErrorCode }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'processing'; result: RecordingResult }
  | { type: 'transcriptionProgress'; progress: TranscriptionProgress }
  | { type: 'transcriptionSegment'; turn: TranscriptTurn }
  | { type: 'processingFailed' }
  | { type: 'retry' }
  | { type: 'saved'; meetingId: string }
  | { type: 'reset' }
  | { type: 'toggleMute'; channel: ChannelKind }
  | { type: 'tick'; deltaMs: number };

const initialState: RecordingState = {
  mode: null,
  status: 'idle',
  meetingName: '',
  muted: { mic: false, sys: false },
  elapsedMs: 0,
  errorCode: null,
  result: null,
  transcription: null,
  liveSegments: [],
  processingFailed: false,
  savedMeetingId: null
};

const channelsForMode = (mode: AudioMode | null): ChannelKind[] => {
  if (mode === 'mic') return ['mic'];
  if (mode === 'sys') return ['sys'];
  if (mode === 'mix') return ['mic', 'sys'];
  return [];
};

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const formatTimecode = (elapsedMs: number): Timecode => {
  const totalCentis = Math.floor(elapsedMs / 10);
  const totalSeconds = Math.floor(totalCentis / 100);
  return {
    minutes: pad2(Math.floor(totalSeconds / 60)),
    seconds: pad2(totalSeconds % 60),
    centis: pad2(totalCentis % 100)
  };
};

const formatDuration = (elapsedMs: number): string => {
  const { minutes, seconds } = formatTimecode(elapsedMs);
  return `${minutes}:${seconds}`;
};

const formatDateParts = (
  date: Date
): { dateLabel: string; timeLabel: string } => ({
  dateLabel: new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date),
  timeLabel: new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
});

type BuildMeetingInput = {
  mode: AudioMode;
  name: string;
  durationLabel: string;
  transcript: TranscriptTurn[];
  audioBlob: Blob;
  languageLabelValue: string;
  modelLabel: string;
};

const buildStoredMeeting = ({
  mode,
  name,
  durationLabel,
  transcript,
  audioBlob,
  languageLabelValue,
  modelLabel
}: BuildMeetingInput): StoredMeeting => {
  const now = new Date();
  const { dateLabel, timeLabel } = formatDateParts(now);
  const modes: AudioMode[] = mode === 'mix' ? ['mic', 'sys'] : [mode];
  const title =
    name.trim() || recordedMeetingDefaults.title(dateLabel, timeLabel);

  return {
    id: crypto.randomUUID(),
    title,
    when: `${dateLabel} · ${timeLabel}`,
    duration: durationLabel,
    status: 'ready',
    modes,
    dateLabel,
    timeLabel,
    tag: recordedMeetingDefaults.tag,
    model: modelLabel,
    language: languageLabelValue,
    participants: [],
    notes: { summary: '', keyPoints: [], actionItems: [], decisions: [] },
    transcript,
    createdAt: now.getTime(),
    audioBlob
  };
};

const recordingReducer = (
  state: RecordingState,
  action: RecordingAction
): RecordingState => {
  switch (action.type) {
    case 'selectMode':
      if (state.status !== 'idle') return state;
      return { ...state, mode: action.mode, errorCode: null };
    case 'setName':
      return { ...state, meetingName: action.name };
    case 'requesting':
      if (state.mode === null || state.status !== 'idle') return state;
      return { ...state, status: 'requesting', errorCode: null };
    case 'started':
      if (state.status !== 'requesting') return state;
      return {
        ...state,
        status: 'recording',
        elapsedMs: 0,
        muted: initialState.muted
      };
    case 'failed':
      return { ...state, status: 'idle', errorCode: action.errorCode };
    case 'pause':
      if (state.status !== 'recording') return state;
      return { ...state, status: 'paused' };
    case 'resume':
      if (state.status !== 'paused') return state;
      return { ...state, status: 'recording' };
    case 'processing':
      return {
        ...state,
        status: 'processing',
        result: action.result,
        transcription: null,
        liveSegments: [],
        processingFailed: false
      };
    case 'transcriptionProgress':
      return { ...state, transcription: action.progress };
    case 'transcriptionSegment':
      return { ...state, liveSegments: [...state.liveSegments, action.turn] };
    case 'processingFailed':
      return { ...state, processingFailed: true };
    case 'retry':
      return {
        ...state,
        processingFailed: false,
        transcription: null,
        liveSegments: []
      };
    case 'saved':
      return { ...state, status: 'saved', savedMeetingId: action.meetingId };
    case 'reset':
      return {
        ...initialState,
        mode: state.mode,
        meetingName: state.meetingName
      };
    case 'toggleMute':
      return {
        ...state,
        muted: {
          ...state.muted,
          [action.channel]: !state.muted[action.channel]
        }
      };
    case 'tick':
      if (state.status !== 'recording') return state;
      return { ...state, elapsedMs: state.elapsedMs + action.deltaMs };
    default:
      return state;
  }
};

const toErrorCode = (error: unknown): RecordingErrorCode =>
  error instanceof RecordingError ? error.code : 'unknown';

export const useRecording = () => {
  const [state, dispatch] = useReducer(recordingReducer, initialState);
  const [analysers, setAnalysers] = useState<ChannelAnalysers>(NO_ANALYSERS);
  const engineRef = useRef<RecordingEngine | null>(null);
  const {
    mode,
    status,
    meetingName,
    muted,
    elapsedMs,
    errorCode,
    result,
    transcription,
    liveSegments,
    processingFailed,
    savedMeetingId
  } = state;

  useEffect(() => {
    if (status !== 'recording') return;

    let last = performance.now();
    const intervalId = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: 'tick', deltaMs: now - last });
      last = now;
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [status]);

  // Tear down the audio graph on unmount (navigation away mid-session).
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const runTranscription = useCallback(
    async (
      recording: RecordingResult,
      captureMode: AudioMode,
      name: string
    ) => {
      const languageCode = getTranscriptionLanguage();
      const model = getTranscriptionModel();
      try {
        const transcript = await transcribeRecording(recording.blob, {
          model,
          language: toWhisperLanguage(languageCode),
          onProgress: progress =>
            dispatch({ type: 'transcriptionProgress', progress }),
          onSegment: turn => dispatch({ type: 'transcriptionSegment', turn })
        });
        const meeting = buildStoredMeeting({
          mode: captureMode,
          name,
          durationLabel: recording.durationLabel,
          transcript,
          audioBlob: recording.blob,
          languageLabelValue: languageLabel(languageCode),
          modelLabel: transcriptionModelLabel(model)
        });
        await saveMeeting(meeting);
        URL.revokeObjectURL(recording.url);
        dispatch({ type: 'saved', meetingId: meeting.id });
      } catch {
        dispatch({ type: 'processingFailed' });
      }
    },
    []
  );

  const start = useCallback(async () => {
    if (mode === null || status !== 'idle') return;
    dispatch({ type: 'requesting' });
    const engine = new RecordingEngine();
    try {
      await engine.start(mode);
      engineRef.current = engine;
      setAnalysers({
        mic: engine.getAnalyser('mic'),
        sys: engine.getAnalyser('sys')
      });
      dispatch({ type: 'started' });
    } catch (error) {
      engine.dispose();
      dispatch({ type: 'failed', errorCode: toErrorCode(error) });
    }
  }, [mode, status]);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    dispatch({ type: 'pause' });
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume();
    dispatch({ type: 'resume' });
  }, []);

  const stop = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || mode === null) return;
    const blob = await engine.stop();
    engineRef.current = null;
    setAnalysers(NO_ANALYSERS);
    const recording: RecordingResult = {
      blob,
      url: URL.createObjectURL(blob),
      mimeType: blob.type,
      durationLabel: formatDuration(elapsedMs)
    };
    dispatch({ type: 'processing', result: recording });
    void runTranscription(recording, mode, meetingName);
  }, [mode, elapsedMs, meetingName, runTranscription]);

  const retryTranscription = useCallback(() => {
    if (!result || mode === null) return;
    dispatch({ type: 'retry' });
    void runTranscription(result, mode, meetingName);
  }, [result, mode, meetingName, runTranscription]);

  const discardResult = useCallback(() => {
    if (result) URL.revokeObjectURL(result.url);
    dispatch({ type: 'reset' });
  }, [result]);

  const toggleMute = useCallback(
    (channel: ChannelKind) => {
      engineRef.current?.setMuted(channel, !muted[channel]);
      dispatch({ type: 'toggleMute', channel });
    },
    [muted]
  );

  const selectMode = useCallback((nextMode: AudioMode) => {
    dispatch({ type: 'selectMode', mode: nextMode });
  }, []);

  const setMeetingName = useCallback((name: string) => {
    dispatch({ type: 'setName', name });
  }, []);

  return {
    mode,
    status,
    meetingName,
    muted,
    analysers,
    channels: channelsForMode(mode),
    timecode: formatTimecode(elapsedMs),
    errorCode,
    result,
    transcription,
    liveSegments,
    processingFailed,
    savedMeetingId,
    isRequesting: status === 'requesting',
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    isProcessing: status === 'processing',
    canStart: mode !== null,
    selectMode,
    setMeetingName,
    start,
    pause,
    resume,
    stop,
    toggleMute,
    retryTranscription,
    discardResult
  };
};
