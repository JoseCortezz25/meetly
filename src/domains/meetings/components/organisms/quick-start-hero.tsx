import { ModeChip } from '../atoms/mode-chip';
import { RecordButton } from '../atoms/record-button';
import { audioModeLabels, dashboardMessages } from '../../messages';
import type { AudioMode } from '../../types/meeting.types';

const HERO_MODES: AudioMode[] = ['mic', 'sys', 'mix'];

export const QuickStartHero = () => {
  const { hero } = dashboardMessages;

  return (
    <section className="border-line rounded-hero mb-[34px] flex flex-col gap-6 overflow-hidden border bg-[radial-gradient(120%_140%_at_90%_0%,_rgba(239,125,78,0.14),_transparent_55%),_var(--color-ink-2)] px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-[30px] sm:px-8 sm:py-[30px]">
      <div>
        <h2 className="font-display text-cream mb-2 text-[27px] font-medium tracking-[-0.5px]">
          {hero.title}
        </h2>
        <p className="text-sand max-w-[360px] text-[14.5px] leading-[1.5]">
          {hero.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {HERO_MODES.map(mode => (
            <ModeChip key={mode} mode={mode} label={audioModeLabels[mode]} />
          ))}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-3">
        <RecordButton href="/record" label={hero.recordAriaLabel} />
        <span className="text-sand text-[12.5px] tracking-[0.3px]">
          {hero.recordHint}
        </span>
      </div>
    </section>
  );
};
