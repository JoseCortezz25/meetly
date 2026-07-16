import type { Timecode as TimecodeValue } from '../../types/recording.types';

type TimecodeProps = {
  value: TimecodeValue;
};

export const Timecode = ({ value }: TimecodeProps) => {
  return (
    <div className="text-cream font-mono text-[66px] font-medium tracking-[1px] tabular-nums">
      {value.minutes}
      <span className="text-sand-2">:</span>
      {value.seconds}
      <span className="text-sand-2 text-[34px]">:{value.centis}</span>
    </div>
  );
};
