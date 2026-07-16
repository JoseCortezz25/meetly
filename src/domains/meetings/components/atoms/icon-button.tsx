import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconButtonProps = {
  /** Accessible name for the icon-only control. */
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
};

export const IconButton = ({
  label,
  icon,
  onClick,
  className
}: IconButtonProps) => {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'border-line-2 text-sand hover:bg-ink-3 hover:text-cream grid size-[46px] place-items-center rounded-[12px] border transition-colors [&_svg]:size-[18px]',
        className
      )}
    >
      {icon}
    </button>
  );
};
