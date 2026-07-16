/**
 * Cross-cutting UI text shared across domains (app shell, navigation, settings).
 * Domain-specific copy stays inside each domain's messages.ts.
 */

export const navMessages = {
  brand: 'Meetly',
  home: 'Home',
  notes: 'Meeting notes',
  settings: 'Settings'
} as const;
