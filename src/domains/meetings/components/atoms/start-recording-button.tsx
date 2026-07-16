import { cn } from '@/lib/utils';

type StartRecordingButtonProps = {
  label: string;
  isDisabled: boolean;
  onClick: () => void;
};

export const StartRecordingButton = ({
  label,
  isDisabled,
  onClick
}: StartRecordingButtonProps) => {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full px-7 py-[13px] text-[14px] font-semibold transition-transform duration-100',
        isDisabled
          ? 'border-line-2 text-sand-2 bg-ink-2 cursor-not-allowed border'
          : 'bg-mic text-ink shadow-[0_8px_26px_rgba(239,125,78,0.35)] hover:-translate-y-0.5 hover:bg-[#f28a5c]'
      )}
    >
      <span
        className={cn(
          'size-3 rounded-full',
          isDisabled ? 'bg-sand-2' : 'bg-ink'
        )}
      />
      {label}
    </button>
  );
};
