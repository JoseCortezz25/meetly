import type { Meeting } from '../types/meeting.types';

/**
 * Placeholder data for laying out the dashboard. Replace with the meetings
 * repository once local persistence is wired up.
 */
export const recentMeetingsMock: Meeting[] = [
  {
    id: 'weekly-product-sync',
    title: 'Weekly product sync',
    when: 'Today · 14:20',
    duration: '48:12',
    status: 'ready',
    modes: ['mic', 'sys']
  },
  {
    id: 'design-review-recorder-ui',
    title: 'Design review — recorder UI',
    when: 'Today · 11:05',
    duration: '32:40',
    status: 'processing',
    modes: ['mix']
  },
  {
    id: '1-1-with-jair',
    title: '1:1 with Jair',
    when: 'Yesterday · 16:30',
    duration: '25:03',
    status: 'ready',
    modes: ['mic']
  },
  {
    id: 'client-kickoff-flare',
    title: 'Client kickoff — Flare',
    when: 'Mon · 09:00',
    duration: '58:47',
    status: 'ready',
    modes: ['sys']
  },
  {
    id: 'sprint-retro',
    title: 'Sprint retro',
    when: 'Fri · 15:15',
    duration: '41:22',
    status: 'ready',
    modes: ['mix']
  },
  {
    id: 'research-local-whisper',
    title: 'Research: local Whisper',
    when: 'Thu · 10:40',
    duration: '19:58',
    status: 'ready',
    modes: ['mic']
  }
];
