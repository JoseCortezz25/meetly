'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { slugify } from '@/utils/slug.util';
import { MeetingNameField } from '../atoms/meeting-name-field';
import { StartRecordingButton } from '../atoms/start-recording-button';
import { RecordingControls } from '../molecules/recording-controls';
import { RecordingProcessing } from './recording-processing';
import { RecordingStage } from './recording-stage';
import { useRecording } from '../../hooks/use-recording';
import { recordingErrorLabels, recordingMessages } from '../../messages';
import type { AudioMode } from '../../types/meeting.types';

const RECORDING_MODES: AudioMode[] = ['mic', 'sys', 'mix'];

export const RecordingWorkspace = () => {
  const router = useRouter();
  const {
    mode,
    status,
    meetingName,
    channels,
    muted,
    analysers,
    timecode,
    errorCode,
    result,
    transcription,
    liveSegments,
    processingFailed,
    savedMeetingId,
    isRequesting,
    isRecording,
    isPaused,
    isProcessing,
    canStart,
    selectMode,
    setMeetingName,
    start,
    pause,
    resume,
    stop,
    toggleMute,
    retryTranscription,
    discardResult
  } = useRecording();

  // Once the meeting is transcribed and persisted, open its detail view.
  useEffect(() => {
    if (savedMeetingId) router.push(`/meeting/${savedMeetingId}`);
  }, [savedMeetingId, router]);

  const isIdle = !isRecording && !isPaused;
  const isPostStop = isProcessing || status === 'saved';
  const { idle } = recordingMessages;

  return (
    <div>
      <Link
        href="/"
        className="text-sand hover:text-cream mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium transition-colors"
      >
        <ChevronLeft className="size-[15px]" />
        {recordingMessages.backToDashboard}
      </Link>

      {isPostStop ? (
        <RecordingProcessing
          transcription={transcription}
          liveSegments={liveSegments}
          processingFailed={processingFailed}
          result={result}
          downloadName={slugify(meetingName)}
          onRetry={retryTranscription}
          onRecordAgain={discardResult}
        />
      ) : (
        <>
          <div className="mb-5">
            <MeetingNameField
              value={meetingName}
              placeholder={recordingMessages.namePlaceholder}
              ariaLabel={recordingMessages.nameAriaLabel}
              onChange={setMeetingName}
            />
          </div>

          <RecordingStage
            modes={RECORDING_MODES}
            activeMode={mode}
            isIdle={isIdle}
            isRecording={isRecording}
            isPaused={isPaused}
            timecode={timecode}
            channels={channels}
            muted={muted}
            analysers={analysers}
            onSelectMode={selectMode}
            onToggleMute={toggleMute}
          />

          <div className="mt-[22px] flex flex-col items-center gap-2.5">
            {isIdle ? (
              <>
                <StartRecordingButton
                  label={isRequesting ? idle.requesting : idle.start}
                  isDisabled={!canStart || isRequesting}
                  onClick={start}
                />
                {errorCode ? (
                  <span className="text-mic text-[12.5px]">
                    {recordingErrorLabels[errorCode]}
                  </span>
                ) : (
                  !canStart && (
                    <span className="text-sand-2 text-[12.5px]">
                      {idle.startDisabledHint}
                    </span>
                  )
                )}
              </>
            ) : (
              <RecordingControls
                timecode={timecode}
                isPaused={isPaused}
                onTogglePause={isPaused ? resume : pause}
                onStop={stop}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
