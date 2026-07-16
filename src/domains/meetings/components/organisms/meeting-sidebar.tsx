import { DetailRow } from '../atoms/detail-row';
import { ModeDot } from '../atoms/mode-dot';
import { ParticipantAvatar } from '../atoms/participant-avatar';
import { meetingDetailMessages } from '../../messages';
import type { AudioMode } from '../../types/meeting.types';
import type { Participant } from '../../types/meeting-detail.types';

type MeetingSidebarProps = {
  duration: string;
  modes: AudioMode[];
  model: string;
  language: string;
  participants: Participant[];
};

const cardStyles = 'border-line bg-ink-2 rounded-[16px] border p-5';
const cardTitleStyles =
  'text-sand-2 mb-4 text-[12px] font-semibold tracking-[1px] uppercase';

export const MeetingSidebar = ({
  duration,
  modes,
  model,
  language,
  participants
}: MeetingSidebarProps) => {
  const { sidebar } = meetingDetailMessages;

  return (
    <aside className="flex flex-col gap-5">
      <div className={cardStyles}>
        <p className={cardTitleStyles}>{sidebar.details}</p>
        <div className="flex flex-col gap-3.5">
          <DetailRow label={sidebar.duration}>
            <span className="font-mono">{duration}</span>
          </DetailRow>
          <DetailRow label={sidebar.channels}>
            <span className="flex items-center gap-1.5">
              {modes.map(mode => (
                <ModeDot key={mode} mode={mode} />
              ))}
            </span>
          </DetailRow>
          <DetailRow label={sidebar.model}>{model}</DetailRow>
          <DetailRow label={sidebar.language}>{language}</DetailRow>
        </div>
      </div>

      {participants.length > 0 && (
        <div className={cardStyles}>
          <p className={cardTitleStyles}>{sidebar.participants}</p>
          <div className="flex flex-col gap-3.5">
            {participants.map(participant => (
              <div key={participant.id} className="flex items-center gap-3">
                <ParticipantAvatar
                  initials={participant.initials}
                  color={participant.color}
                />
                <span className="text-cream text-[14.5px]">
                  {participant.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
