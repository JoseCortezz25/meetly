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
    <header className="mb-[34px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sand text-[13px] tracking-[0.3px]">{dateLabel}</p>
        <h1 className="font-display text-cream mt-0.5 text-[26px] font-medium tracking-[-0.6px] sm:text-[30px]">
          {greeting}
        </h1>
      </div>
      <label className="border-line bg-ink-2 text-sand focus-within:border-line-2 flex w-full items-center gap-2.5 rounded-full border px-4 py-2.5 sm:w-[230px]">
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
