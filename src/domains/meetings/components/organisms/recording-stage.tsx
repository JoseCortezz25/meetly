import { CaptureHint } from '../atoms/capture-hint';
import { RecordingPill } from '../atoms/recording-pill';
import { Timecode } from '../atoms/timecode';
import { CaptureChannel } from '../molecules/capture-channel';
import { ModeSelector } from '../molecules/mode-selector';
import { recordingMessages } from '../../messages';
import type { AudioMode } from '../../types/meeting.types';
import type {
  ChannelAnalysers,
  ChannelKind,
  ChannelMuteState,
  Timecode as TimecodeValue
} from '../../types/recording.types';

type RecordingStageProps = {
  modes: AudioMode[];
  activeMode: AudioMode | null;
  isIdle: boolean;
  isRecording: boolean;
  isPaused: boolean;
  timecode: TimecodeValue;
  channels: ChannelKind[];
  muted: ChannelMuteState;
  analysers: ChannelAnalysers;
  onSelectMode: (mode: AudioMode) => void;
  onToggleMute: (channel: ChannelKind) => void;
};

const muteAriaLabel = (channel: ChannelKind, isMuted: boolean): string => {
  const { channelAria } = recordingMessages;
  if (channel === 'mic')
    return isMuted ? channelAria.unmuteMic : channelAria.muteMic;
  return isMuted ? channelAria.unmuteSystem : channelAria.muteSystem;
};

export const RecordingStage = ({
  modes,
  activeMode,
  isIdle,
  isRecording,
  isPaused,
  timecode,
  channels,
  muted,
  analysers,
  onSelectMode,
  onToggleMute
}: RecordingStageProps) => {
  const { idle, status, hint } = recordingMessages;
  const hasSystemChannel = channels.includes('sys');

  return (
    <section className="border-line rounded-lg border bg-[radial-gradient(120%_90%_at_50%_-10%,_rgba(239,125,78,0.08),_transparent_60%),_var(--color-ink-2)] p-[30px]">
      <ModeSelector
        modes={modes}
        activeMode={activeMode}
        isLocked={!isIdle}
        onSelect={onSelectMode}
      />

      <div className="mt-[30px] mb-[26px] text-center">
        {isIdle ? (
          <div className="mx-auto max-w-[440px]">
            <p className="text-sand text-[12.5px] tracking-[0.4px] uppercase">
              {idle.eyebrow}
            </p>
            <h2 className="font-display text-cream mt-2 text-[27px] font-medium tracking-[-0.5px]">
              {idle.title}
            </h2>
            <p className="text-sand mt-2 text-[14px] leading-[1.5]">
              {idle.description}
            </p>
          </div>
        ) : (
          <>
            <RecordingPill
              label={isPaused ? status.paused : status.recording}
              isPaused={isPaused}
            />
            <div className="mt-3.5">
              <Timecode value={timecode} />
            </div>
          </>
        )}
      </div>

      {channels.length === 0 ? (
        <p className="text-sand-2 rounded-card border-line border border-dashed py-10 text-center text-[13.5px]">
          {idle.channelsPlaceholder}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-[18px]">
          {channels.map(channel => (
            <CaptureChannel
              key={channel}
              channel={channel}
              isMuted={muted[channel]}
              isActive={isRecording && !muted[channel]}
              muteLabel={muteAriaLabel(channel, muted[channel])}
              analyser={analysers[channel]}
              onToggleMute={() => onToggleMute(channel)}
            />
          ))}
        </div>
      )}

      {hasSystemChannel && <CaptureHint text={hint} />}
    </section>
  );
};
