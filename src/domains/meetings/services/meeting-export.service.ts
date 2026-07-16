import { slugify } from '@/utils/slug.util';
import type { MeetingDetail } from '../types/meeting-detail.types';

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const meetingHeading = (meeting: MeetingDetail): string =>
  `_${meeting.dateLabel} · ${meeting.timeLabel} · ${meeting.duration}_`;

export const notesToMarkdown = (meeting: MeetingDetail): string => {
  const { notes } = meeting;
  const lines: string[] = [
    `# ${meeting.title}`,
    '',
    meetingHeading(meeting),
    ''
  ];

  if (notes.summary.trim()) {
    lines.push('## Summary', '', notes.summary.trim(), '');
  }
  if (notes.keyPoints.length > 0) {
    lines.push(
      '## Key points',
      '',
      ...notes.keyPoints.map(point => `- ${point}`),
      ''
    );
  }
  if (notes.actionItems.length > 0) {
    lines.push(
      '## Action items',
      '',
      ...notes.actionItems.map(
        item =>
          `- [${item.done ? 'x' : ' '}] ${item.title} — Owner: ${item.owner} · ${item.due}`
      ),
      ''
    );
  }
  if (notes.decisions.length > 0) {
    lines.push(
      '## Decisions',
      '',
      ...notes.decisions.map(decision => `- ${decision}`),
      ''
    );
  }

  return lines.join('\n');
};

export const transcriptToMarkdown = (meeting: MeetingDetail): string => {
  const lines: string[] = [
    `# ${meeting.title} — Transcript`,
    '',
    meetingHeading(meeting),
    ''
  ];
  meeting.transcript.forEach(turn => {
    const speaker = turn.speaker ? `**${turn.speaker}** ` : '';
    lines.push(`\`${turn.time}\` ${speaker}${turn.text}`, '');
  });
  return lines.join('\n');
};

export const exportNotes = (meeting: MeetingDetail): void => {
  const content = notesToMarkdown(meeting);
  triggerDownload(
    new Blob([content], { type: 'text/markdown;charset=utf-8' }),
    `${slugify(meeting.title)}-notes.md`
  );
};

export const exportTranscript = (meeting: MeetingDetail): void => {
  const content = transcriptToMarkdown(meeting);
  triggerDownload(
    new Blob([content], { type: 'text/markdown;charset=utf-8' }),
    `${slugify(meeting.title)}-transcript.md`
  );
};

export const downloadAudio = (blob: Blob, title: string): void => {
  triggerDownload(blob, `${slugify(title)}.webm`);
};
