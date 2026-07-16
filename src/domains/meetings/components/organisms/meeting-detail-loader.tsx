'use client';

import { useEffect, useState } from 'react';
import { MeetingDetailView } from '../templates/meeting-detail-view';
import { getMeetingDetail } from '../../data/meeting-detail.mock';
import { getStoredMeeting } from '../../services/meetings-repository.service';
import { meetingDetailMessages } from '../../messages';
import type { MeetingDetail } from '../../types/meeting-detail.types';

type MeetingDetailLoaderProps = {
  id: string;
};

type LoaderState =
  | { status: 'loading' }
  | {
      status: 'found';
      meeting: MeetingDetail;
      audioBlob?: Blob;
      isStored: boolean;
    }
  | { status: 'missing' };

const StatusPanel = ({ text }: { text: string }) => (
  <main className="relative z-[2] mx-auto max-w-[1180px] px-[34px] pt-[26px] pb-[80px]">
    <p className="text-sand-2 border-line rounded-card border border-dashed py-16 text-center text-[14px]">
      {text}
    </p>
  </main>
);

export const MeetingDetailLoader = ({ id }: MeetingDetailLoaderProps) => {
  // Seeded mock meetings resolve synchronously; persisted ones load from IndexedDB.
  const [state, setState] = useState<LoaderState>(() => {
    const seeded = getMeetingDetail(id);
    return seeded
      ? { status: 'found', meeting: seeded, isStored: false }
      : { status: 'loading' };
  });

  useEffect(() => {
    if (state.status !== 'loading') return;
    let active = true;
    getStoredMeeting(id)
      .then(stored => {
        if (!active) return;
        setState(
          stored
            ? {
                status: 'found',
                meeting: stored,
                audioBlob: stored.audioBlob,
                isStored: true
              }
            : { status: 'missing' }
        );
      })
      .catch(() => {
        if (active) setState({ status: 'missing' });
      });
    return () => {
      active = false;
    };
  }, [id, state.status]);

  if (state.status === 'loading')
    return <StatusPanel text={meetingDetailMessages.loading} />;
  if (state.status === 'missing')
    return <StatusPanel text={meetingDetailMessages.notFound} />;
  return (
    <MeetingDetailView
      meeting={state.meeting}
      audioBlob={state.audioBlob}
      isStored={state.isStored}
    />
  );
};
