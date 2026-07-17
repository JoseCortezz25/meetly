'use client';

import { useEffect, useState } from 'react';
import { NoteListCard } from '../molecules/note-list-card';
import { listStoredMeetings } from '../../services/meetings-repository.service';
import { notesListMessages } from '../../messages';
import type { MeetingDetail } from '../../types/meeting-detail.types';

export const NotesList = () => {
  const [meetings, setMeetings] = useState<MeetingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listStoredMeetings()
      .then(rows => {
        if (active) setMeetings(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

      {!isLoading && meetings.length === 0 ? (
        <p className="text-sand-2 border-line rounded-card border border-dashed py-12 text-center text-[14px]">
          {notesListMessages.empty}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {meetings.map(meeting => (
            <NoteListCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </section>
  );
};
