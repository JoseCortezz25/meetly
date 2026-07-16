import { NoteHeading } from '../atoms/note-heading';
import { ActionItemCard } from '../molecules/action-item-card';
import { meetingDetailMessages } from '../../messages';
import type { MeetingNotes } from '../../types/meeting-detail.types';

type AiNotesPanelProps = {
  notes: MeetingNotes;
};

export const AiNotesPanel = ({ notes }: AiNotesPanelProps) => {
  const { sections, actionItemMeta } = meetingDetailMessages;

  const isEmpty =
    notes.summary.trim().length === 0 &&
    notes.keyPoints.length === 0 &&
    notes.actionItems.length === 0 &&
    notes.decisions.length === 0;

  if (isEmpty) {
    return (
      <p className="text-sand-2 border-line rounded-card border border-dashed py-12 text-center text-[14px]">
        {meetingDetailMessages.notesEmpty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3.5">
        <NoteHeading title={sections.summary} accent="gold" />
        <p className="text-sand max-w-[680px] text-[15.5px] leading-[1.65]">
          {notes.summary}
        </p>
      </section>

      <section className="flex flex-col gap-3.5">
        <NoteHeading title={sections.keyPoints} accent="sys" />
        <ul className="flex flex-col gap-3">
          {notes.keyPoints.map((point, index) => (
            <li
              key={index}
              className="text-cream flex gap-3 text-[15px] leading-snug"
            >
              <span
                className="bg-sys mt-[9px] size-1.5 shrink-0 rounded-full"
                aria-hidden
              />
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3.5">
        <NoteHeading title={sections.actionItems} accent="mic" />
        <div className="flex flex-col gap-3">
          {notes.actionItems.map(item => (
            <ActionItemCard
              key={item.id}
              item={item}
              ownerLabel={actionItemMeta.owner}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <NoteHeading title={sections.decisions} accent="ok" />
        <ul className="flex flex-col gap-3">
          {notes.decisions.map((decision, index) => (
            <li
              key={index}
              className="text-cream flex gap-3 text-[15px] leading-snug"
            >
              <span
                className="bg-sys mt-[9px] size-1.5 shrink-0 rounded-full"
                aria-hidden
              />
              {decision}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
