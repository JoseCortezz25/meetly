import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ControlVariant = 'default' | 'pause' | 'stop';

type ControlButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: ControlVariant;
  /** Toggled state for the pause/mute controls (drives the accent styling). */
  isActive?: boolean;
};

const variantStyles: Record<ControlVariant, string> = {
  default: 'border-line-2 bg-ink-2 text-cream hover:bg-ink-3',
  pause: 'border-line-2 bg-ink-2 text-cream hover:bg-ink-3',
  stop: 'border-transparent bg-mic text-ink hover:bg-[#f28a5c]'
};

export const ControlButton = ({
  label,
  icon,
  onClick,
  variant = 'default',
  isActive = false
}: ControlButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13.5px] font-semibold transition-transform duration-100 hover:-translate-y-0.5 sm:gap-2.5 sm:px-[22px] sm:py-[13px] sm:text-[14px] [&_svg]:size-[17px] sm:[&_svg]:size-[18px]',
        variantStyles[variant],
        isActive &&
          variant === 'pause' &&
          'border-gold/40 bg-gold/10 text-gold',
        isActive && variant === 'default' && 'border-mic/40 bg-mic/15 text-mic'
      )}
    >
      {icon}
      {label}
    </button>
  );
};
