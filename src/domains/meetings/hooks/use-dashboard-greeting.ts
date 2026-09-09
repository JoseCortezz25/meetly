'use client';

import { useEffect, useState } from 'react';
import { dashboardMessages } from '../messages';
import { formatDateLabel, resolveGreetingKey } from '../utils/greeting.util';

type DashboardGreeting = {
  greeting: string;
  dateLabel: string;
};

/**
 * Resolves the greeting and date label from the user's LOCAL clock.
 *
 * The server render (passed as `initial`) is only a first-paint fallback based
 * on the server timezone. After mount we recompute with the browser clock so
 * the greeting matches the user's actual time, not the server's.
 */
export const useDashboardGreeting = (
  initial: DashboardGreeting
): DashboardGreeting => {
  const [greeting, setGreeting] = useState<DashboardGreeting>(initial);

  useEffect(() => {
    const now = new Date();
    setGreeting({
      greeting: dashboardMessages.greeting[resolveGreetingKey(now.getHours())],
      dateLabel: formatDateLabel(now)
    });
  }, []);

  return greeting;
};
