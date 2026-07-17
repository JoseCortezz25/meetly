import type { Timecode as TimecodeValue } from '../../types/recording.types';

type TimecodeProps = {
  value: TimecodeValue;
};

export const Timecode = ({ value }: TimecodeProps) => {
  return (
    <div className="text-cream font-mono text-[44px] font-medium tracking-[1px] tabular-nums sm:text-[66px]">
      {value.minutes}
      <span className="text-sand-2">:</span>
      {value.seconds}
      <span className="text-sand-2 text-[24px] sm:text-[34px]">
        :{value.centis}
      </span>
    </div>
  );
};
