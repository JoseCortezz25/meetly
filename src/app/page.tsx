import { DashboardHeader } from '@/domains/meetings/components/organisms/dashboard-header';
import { QuickStartHero } from '@/domains/meetings/components/organisms/quick-start-hero';
import { RecentMeetings } from '@/domains/meetings/components/organisms/recent-meetings';
import { recentMeetingsMock } from '@/domains/meetings/data/recent-meetings.mock';
import { dashboardMessages } from '@/domains/meetings/messages';

const resolveGreeting = (hour: number): string => {
  if (hour < 12) return dashboardMessages.greeting.morning;
  if (hour < 18) return dashboardMessages.greeting.afternoon;
  return dashboardMessages.greeting.evening;
};

const formatDateLabel = (date: Date): string => {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
    date
  );
  const dayMonth = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long'
  }).format(date);
  return `${weekday}, ${dayMonth}`;
};

export default function Home() {
  const now = new Date();

  return (
    <main className="relative z-[2] mx-auto max-w-[1180px] px-[34px] pt-[26px] pb-[60px]">
      <DashboardHeader
        dateLabel={formatDateLabel(now)}
        greeting={resolveGreeting(now.getHours())}
      />
      <QuickStartHero />
      <RecentMeetings meetings={recentMeetingsMock} />
    </main>
  );
}
