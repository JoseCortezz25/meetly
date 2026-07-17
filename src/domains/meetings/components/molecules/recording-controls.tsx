import { Pause, Play, Square } from 'lucide-react';
import { ControlButton } from '../atoms/control-button';
import { recordingMessages } from '../../messages';
import type { Timecode as TimecodeValue } from '../../types/recording.types';

type RecordingControlsProps = {
  timecode: TimecodeValue;
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
};

export const RecordingControls = ({
  timecode,
  isPaused,
  onTogglePause,
  onStop
}: RecordingControlsProps) => {
  const { controls } = recordingMessages;

  return (
    <div className="border-line bg-ink-2 flex max-w-full flex-wrap items-center justify-center gap-2 rounded-[26px] border p-2 px-3 sm:gap-3 sm:rounded-full sm:pr-2 sm:pl-5">
      <span className="text-sand font-mono text-[15px] font-medium tracking-[1px] tabular-nums">
        {timecode.minutes}:{timecode.seconds}
      </span>
      <span className="bg-line h-6 w-px" />
      <ControlButton
        label={isPaused ? controls.resume : controls.pause}
        icon={isPaused ? <Play /> : <Pause />}
        variant="pause"
        isActive={isPaused}
        onClick={onTogglePause}
      />
      <ControlButton
        label={controls.stopAndSave}
        icon={<Square className="fill-current" />}
        variant="stop"
        onClick={onStop}
      />
    </div>
  );
};
