import { Search } from 'lucide-react';
import { dashboardMessages } from '../../messages';

type DashboardHeaderProps = {
  dateLabel: string;
  greeting: string;
};

export const DashboardHeader = ({
  dateLabel,
  greeting
}: DashboardHeaderProps) => {
  return (
    <header className="mb-[34px] flex items-center justify-between gap-4">
      <div>
        <p className="text-sand text-[13px] tracking-[0.3px]">{dateLabel}</p>
        <h1 className="font-display text-cream mt-0.5 text-[30px] font-medium tracking-[-0.6px]">
          {greeting}
        </h1>
      </div>
      <label className="border-line bg-ink-2 text-sand focus-within:border-line-2 flex w-[230px] items-center gap-2.5 rounded-full border px-4 py-2.5">
        <Search className="size-[15px] shrink-0" />
        <input
          type="search"
          placeholder={dashboardMessages.searchPlaceholder}
          className="text-cream placeholder:text-sand w-full bg-transparent text-[13.5px] focus:outline-none"
        />
      </label>
    </header>
  );
};
