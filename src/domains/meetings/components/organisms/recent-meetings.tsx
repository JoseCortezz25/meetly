'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MeetingCard } from '../molecules/meeting-card';
import { listStoredMeetings } from '../../services/meetings-repository.service';
import { dashboardMessages } from '../../messages';
import type { Meeting } from '../../types/meeting.types';

export const RecentMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
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
      {!isLoading && meetings.length === 0 ? (
        <p className="text-sand-2 border-line rounded-card border border-dashed py-12 text-center text-[14px]">
          {dashboardMessages.recent.empty}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {meetings.map((meeting, index) => (
            <MeetingCard key={meeting.id} meeting={meeting} seed={index + 1} />
          ))}
        </div>
      )}
    </section>
  );
};
