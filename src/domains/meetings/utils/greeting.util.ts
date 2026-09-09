export type GreetingKey = 'morning' | 'afternoon' | 'evening';

/**
 * Maps a 24h hour to a greeting slot.
 * Pure function — the caller decides which clock (server or client) to read.
 */
export const resolveGreetingKey = (hour: number): GreetingKey => {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export const formatDateLabel = (date: Date): string => {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
    date
  );
  const dayMonth = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long'
  }).format(date);
  return `${weekday}, ${dayMonth}`;
};
