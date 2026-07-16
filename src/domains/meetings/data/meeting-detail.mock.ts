import type { MeetingDetail } from '../types/meeting-detail.types';
import { recentMeetingsMock } from './recent-meetings.mock';

/**
 * Placeholder detail for laying out the meeting view. Replace with the meetings
 * repository once local persistence and on-device notes are wired up.
 */
const weeklyProductSync: MeetingDetail = {
  id: 'weekly-product-sync',
  title: 'Weekly product sync',
  when: 'Today · 14:20',
  duration: '48:12',
  status: 'ready',
  modes: ['mic', 'sys'],
  dateLabel: '15 Jul 2026',
  timeLabel: '14:20',
  tag: 'Product',
  model: 'Llama 3.2 3B',
  language: 'English',
  participants: [
    { id: 'you', name: 'Alfonso (you)', initials: 'AC', color: 'mic' },
    { id: 'jair', name: 'Jair Montenegro', initials: 'JM', color: 'sys' },
    { id: 'hebert', name: 'Hebert Romero', initials: 'HR', color: 'gold' }
  ],
  notes: {
    summary:
      'The team aligned on prioritizing the recorder UI for this sprint, with per-channel volume metering as a core requirement. The macOS system-audio limitation was acknowledged and will be reflected in the design. The local-first pipeline (on-device capture → transcription → notes) remains the guiding principle.',
    keyPoints: [
      'Recorder supports three capture modes: microphone, system (tab) audio, and mixed.',
      'Volume metering must be per channel, not a single combined meter.',
      'On macOS, only browser-tab audio is capturable — native apps need a desktop shell.',
      'Transcription and notes run locally (browser-whisper + WebLLM) after saving.'
    ],
    actionItems: [
      {
        id: 'a1',
        title: 'Ship the alternative recorder layout for review',
        owner: 'Alfonso',
        due: 'Due Thu',
        done: false
      },
      {
        id: 'a2',
        title: 'Validate tab-audio capture on macOS Chrome',
        owner: 'Jair',
        due: 'Due Fri',
        done: false
      },
      {
        id: 'a3',
        title: 'Wire per-channel AnalyserNode meters in React',
        owner: 'Hebert',
        due: 'Next sprint',
        done: false
      }
    ],
    decisions: [
      'Adopt the "studio lanes" direction as a candidate for the recording screen.',
      'Keep exports notes-only (Markdown); the transcript stays in-app.'
    ]
  },
  transcript: [
    {
      id: 't1',
      speaker: 'Alfonso',
      time: '00:12',
      text: "Let's start with the recorder UI — I want per-channel metering to be the headline of this sprint."
    },
    {
      id: 't2',
      speaker: 'Jair',
      time: '01:40',
      text: 'Agreed. On macOS we can only grab a shared browser tab, so we should make that explicit in the capture hint.'
    },
    {
      id: 't3',
      speaker: 'Hebert',
      time: '03:05',
      text: "I'll wire the AnalyserNode per channel so the meters stay independent rather than a single combined level."
    },
    {
      id: 't4',
      speaker: 'Alfonso',
      time: '05:22',
      text: 'Exports stay notes-only in Markdown. The full transcript lives in the app for now.'
    }
  ]
};

const meetingDetailMock: Record<string, MeetingDetail> = {
  [weeklyProductSync.id]: weeklyProductSync
};

/**
 * Resolves a meeting detail by id. Known meetings from the dashboard fall back
 * to the sample notes so every card opens a populated view during layout work.
 */
export const getMeetingDetail = (id: string): MeetingDetail | undefined => {
  const detail = meetingDetailMock[id];
  if (detail) return detail;

  const base = recentMeetingsMock.find(meeting => meeting.id === id);
  if (!base) return undefined;

  return {
    ...weeklyProductSync,
    id: base.id,
    title: base.title,
    when: base.when,
    duration: base.duration,
    status: base.status,
    modes: base.modes
  };
};

/**
 * Returns every meeting that already has notes (status "ready"), enriched with
 * its detail. Used by the meeting-notes listing view.
 */
export const getMeetingNotesList = (): MeetingDetail[] =>
  recentMeetingsMock
    .filter(meeting => meeting.status === 'ready')
    .map(meeting => getMeetingDetail(meeting.id))
    .filter((meeting): meeting is MeetingDetail => Boolean(meeting));
