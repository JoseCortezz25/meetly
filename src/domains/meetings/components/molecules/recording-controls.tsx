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
    <div className="border-line bg-ink-2 inline-flex items-center gap-3 rounded-full border p-2 pl-5">
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
