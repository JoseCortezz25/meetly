import { DashboardHeader } from '@/domains/meetings/components/organisms/dashboard-header';
import { QuickStartHero } from '@/domains/meetings/components/organisms/quick-start-hero';
import { RecentMeetings } from '@/domains/meetings/components/organisms/recent-meetings';
import { dashboardMessages } from '@/domains/meetings/messages';
import {
  formatDateLabel,
  resolveGreetingKey,
  selectGreeting
} from '@/domains/meetings/utils/greeting.util';

export default function Home() {
  const now = new Date();
  // Deterministic first-paint fallback; the client recomputes a varied phrase
  // from the browser clock after mount.
  const greetingPhrases =
    dashboardMessages.greeting[resolveGreetingKey(now.getHours())];

  return (
    <main className="relative z-[2] mx-auto max-w-[1180px] px-4 pt-[26px] pb-[60px] sm:px-[34px]">
      <DashboardHeader
        dateLabel={formatDateLabel(now)}
        greeting={selectGreeting(greetingPhrases, 0)}
      />
      <QuickStartHero />
      <RecentMeetings />
    </main>
  );
}
