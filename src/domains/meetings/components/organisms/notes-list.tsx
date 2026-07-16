'use client';

import { useEffect, useState } from 'react';
import { NoteListCard } from '../molecules/note-list-card';
import { listStoredMeetings } from '../../services/meetings-repository.service';
import { notesListMessages } from '../../messages';
import type { MeetingDetail } from '../../types/meeting-detail.types';

type NotesListProps = {
  meetings: MeetingDetail[];
};

export const NotesList = ({ meetings }: NotesListProps) => {
  const [stored, setStored] = useState<MeetingDetail[]>([]);

  useEffect(() => {
    let active = true;
    listStoredMeetings()
      .then(rows => {
        if (active) setStored(rows);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const allMeetings = [...stored, ...meetings];

  return (
    <section>
      <div className="mb-8">
        <h1 className="font-display text-cream text-[32px] font-medium tracking-[-0.5px]">
          {notesListMessages.title}
        </h1>
        <p className="text-sand mt-1.5 text-[14.5px]">
          {notesListMessages.description}
        </p>
      </div>

      {allMeetings.length === 0 ? (
        <p className="text-sand-2 border-line rounded-card border border-dashed py-12 text-center text-[14px]">
          {notesListMessages.empty}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {allMeetings.map(meeting => (
            <NoteListCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </section>
  );
};
