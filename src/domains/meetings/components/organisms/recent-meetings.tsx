'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MeetingCard } from '../molecules/meeting-card';
import { listStoredMeetings } from '../../services/meetings-repository.service';
import { dashboardMessages } from '../../messages';
import type { Meeting } from '../../types/meeting.types';

type RecentMeetingsProps = {
  meetings: Meeting[];
};

export const RecentMeetings = ({ meetings }: RecentMeetingsProps) => {
  const [stored, setStored] = useState<Meeting[]>([]);

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

  // Newest recordings first, then the seeded sample meetings.
  const allMeetings = [...stored, ...meetings];

  return (
    <section>
      <div className="mb-[18px] flex items-baseline justify-between">
        <h2 className="font-display text-cream text-[20px] font-medium tracking-[-0.3px]">
          {dashboardMessages.recent.title}
        </h2>
        <Link
          href="/notes"
          className="text-sand hover:text-cream text-[13px] transition-colors"
        >
          {dashboardMessages.recent.viewAll}
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {allMeetings.map((meeting, index) => (
          <MeetingCard key={meeting.id} meeting={meeting} seed={index + 1} />
        ))}
      </div>
    </section>
  );
};
