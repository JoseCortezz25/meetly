export type MeetingStatus = 'ready' | 'processing' | 'recording';

export type AudioMode = 'mic' | 'sys' | 'mix';

export type Meeting = {
  id: string;
  title: string;
  /** Human-readable capture moment, e.g. "Today · 14:20". */
  when: string;
  /** Duration as mm:ss, e.g. "48:12". */
  duration: string;
  status: MeetingStatus;
  modes: AudioMode[];
};
