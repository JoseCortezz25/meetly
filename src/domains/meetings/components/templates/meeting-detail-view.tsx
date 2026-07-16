import { MeetingDetailHeader } from '../organisms/meeting-detail-header';
import { MeetingNotesSection } from '../organisms/meeting-notes';
import { MeetingSidebar } from '../organisms/meeting-sidebar';
import type { MeetingDetail } from '../../types/meeting-detail.types';

type MeetingDetailViewProps = {
  meeting: MeetingDetail;
  audioBlob?: Blob;
  isStored: boolean;
};

export const MeetingDetailView = ({
  meeting,
  audioBlob,
  isStored
}: MeetingDetailViewProps) => {
  return (
    <main className="relative z-[2] mx-auto max-w-[1180px] px-[34px] pt-[26px] pb-[80px]">
      <MeetingDetailHeader
        meeting={meeting}
        audioBlob={audioBlob}
        isStored={isStored}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <MeetingNotesSection
          meetingId={meeting.id}
          notes={meeting.notes}
          transcript={meeting.transcript}
          isStored={isStored}
        />
        <MeetingSidebar
          duration={meeting.duration}
          modes={meeting.modes}
          model={meeting.model}
          language={meeting.language}
          participants={meeting.participants}
        />
      </div>
    </main>
  );
};
