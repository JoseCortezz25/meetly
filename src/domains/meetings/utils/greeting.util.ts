export type GreetingKey =
  | 'night'
  | 'dawn'
  | 'morning'
  | 'afternoon'
  | 'evening';

/**
 * Maps a 24h hour to a greeting slot.
 * Pure function — the caller decides which clock (server or client) to read.
 */
export const resolveGreetingKey = (hour: number): GreetingKey => {
  if (hour < 5) return 'night';
  if (hour < 8) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

/**
 * Picks one phrase from a slot's pool by seed. Pure and seeded (never calls
 * Math.random itself) so selection is unit-testable and the caller controls
 * when it varies — avoiding a hydration mismatch between server and client.
 */
export const selectGreeting = (
  phrases: readonly string[],
  seed: number
): string => {
  if (phrases.length === 0) return '';
  const index = Math.abs(Math.trunc(seed)) % phrases.length;
  return phrases[index];
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
