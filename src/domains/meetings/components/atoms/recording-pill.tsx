import { cn } from '@/lib/utils';

type RecordingPillProps = {
  label: string;
  isPaused: boolean;
};

export const RecordingPill = ({ label, isPaused }: RecordingPillProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full border px-4 py-[7px] text-[12.5px] font-semibold tracking-[0.6px] uppercase',
        isPaused
          ? 'border-gold/30 bg-gold/10 text-gold'
          : 'border-mic/30 bg-mic/15 text-mic'
      )}
    >
      <span
        className={cn(
          'size-[9px] rounded-full',
          isPaused ? 'bg-gold' : 'bg-mic animate-pulse'
        )}
      />
      {label}
    </span>
  );
};
