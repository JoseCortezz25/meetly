import { cn } from '@/lib/utils';

type NoteAccent = 'gold' | 'sys' | 'mic' | 'ok';

type NoteHeadingProps = {
  title: string;
  accent: NoteAccent;
};

const accentBar: Record<NoteAccent, string> = {
  gold: 'bg-gold',
  sys: 'bg-sys',
  mic: 'bg-mic',
  ok: 'bg-ok'
};

export const NoteHeading = ({ title, accent }: NoteHeadingProps) => {
  return (
    <h3 className="flex items-center gap-2.5">
      <span
        className={cn(
          'h-[18px] w-[3px] shrink-0 rounded-full',
          accentBar[accent]
        )}
        aria-hidden
      />
      <span className="font-display text-cream text-[21px] font-medium tracking-[-0.2px]">
        {title}
      </span>
    </h3>
  );
};
