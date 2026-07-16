import Link from 'next/link';
import { cn } from '@/lib/utils';

type RecordButtonProps = {
  label: string;
  /** When provided the button renders as a link to the recording view. */
  href?: string;
  className?: string;
};

const buttonClasses = cn(
  'border-line-2 relative grid size-[108px] place-items-center rounded-full border',
  'bg-[radial-gradient(circle_at_50%_35%,var(--color-ink-4),var(--color-ink-2))]',
  'transition-transform hover:scale-105'
);

const RecordButtonBody = () => (
  <>
    <span className="border-mic/20 absolute -inset-1.5 animate-ping rounded-full border" />
    <span className="from-mic size-11 rounded-[14px] bg-gradient-to-br to-[#d85f34] shadow-[0_8px_26px_rgba(239,125,78,0.45)]" />
  </>
);

export const RecordButton = ({ label, href, className }: RecordButtonProps) => {
  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={cn(buttonClasses, className)}
      >
        <RecordButtonBody />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(buttonClasses, className)}
    >
      <RecordButtonBody />
    </button>
  );
};
