'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlignLeft,
  AudioLines,
  Check,
  ChevronDown,
  ChevronLeft,
  Download,
  FileText,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '../atoms/status-badge';
import { ModeDot } from '../atoms/mode-dot';
import { MeetingTag } from '../atoms/meeting-tag';
import { IconButton } from '../atoms/icon-button';
import {
  deleteStoredMeeting,
  updateStoredMeetingTitle
} from '../../services/meetings-repository.service';
import {
  downloadAudio,
  exportNotes,
  exportTranscript
} from '../../services/meeting-export.service';
import { meetingDetailMessages, meetingStatusLabels } from '../../messages';
import type { MeetingDetail } from '../../types/meeting-detail.types';

type MeetingDetailHeaderProps = {
  meeting: MeetingDetail;
  audioBlob?: Blob;
  /** True for meetings persisted in IndexedDB (deletable). */
  isStored: boolean;
};

type ExportItem = {
  key: string;
  icon: ReactNode;
  label: string;
  onSelect: () => void;
};

export const MeetingDetailHeader = ({
  meeting,
  audioBlob,
  isStored
}: MeetingDetailHeaderProps) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(meeting.title);
  const { actions, backToDashboard } = meetingDetailMessages;

  const startEditingTitle = () => {
    setDraftTitle(title);
    setIsEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
  };

  const saveTitle = () => {
    const trimmed = draftTitle.trim();
    setIsEditingTitle(false);
    if (trimmed.length === 0 || trimmed === title) return;
    setTitle(trimmed);
    void updateStoredMeetingTitle(meeting.id, trimmed);
  };

  const hasNotes =
    meeting.notes.summary.trim().length > 0 ||
    meeting.notes.keyPoints.length > 0 ||
    meeting.notes.actionItems.length > 0 ||
    meeting.notes.decisions.length > 0;
  const hasTranscript = meeting.transcript.length > 0;

  const exportItems: ExportItem[] = [];
  if (hasNotes) {
    exportItems.push({
      key: 'notes',
      icon: <FileText />,
      label: actions.exportNotes,
      onSelect: () => exportNotes({ ...meeting, title })
    });
  }
  if (hasTranscript) {
    exportItems.push({
      key: 'transcript',
      icon: <AlignLeft />,
      label: actions.exportTranscript,
      onSelect: () => exportTranscript(meeting)
    });
  }
  if (audioBlob) {
    exportItems.push({
      key: 'audio',
      icon: <AudioLines />,
      label: actions.downloadAudio,
      onSelect: () => downloadAudio(audioBlob, title)
    });
  }

  const handleDelete = async () => {
    await deleteStoredMeeting(meeting.id);
    router.push('/');
  };

  return (
    <header>
      <Link
        href="/"
        className="text-sand hover:text-cream mb-6 inline-flex items-center gap-1.5 text-[14px] transition-colors"
      >
        <ChevronLeft className="size-[16px]" />
        {backToDashboard}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  autoFocus
                  value={draftTitle}
                  onChange={event => setDraftTitle(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') saveTitle();
                    if (event.key === 'Escape') cancelEditingTitle();
                  }}
                  aria-label={actions.editTitle}
                  placeholder={actions.renamePlaceholder}
                  className="font-display text-cream border-line-2 focus:border-sys placeholder:text-sand-2 max-w-[560px] min-w-0 flex-1 border-b bg-transparent text-[28px] leading-none font-medium tracking-[-0.5px] focus:outline-none sm:text-[40px]"
                />
                <IconButton
                  label={actions.renameSave}
                  icon={<Check />}
                  onClick={saveTitle}
                  className="size-8 rounded-[8px] [&_svg]:size-[15px]"
                />
                <IconButton
                  label={actions.renameCancel}
                  icon={<X />}
                  onClick={cancelEditingTitle}
                  className="size-8 rounded-[8px] border-transparent [&_svg]:size-[15px]"
                />
              </>
            ) : (
              <>
                <h1 className="font-display text-cream text-[28px] leading-none font-medium tracking-[-0.5px] sm:text-[40px]">
                  {title}
                </h1>
                <IconButton
                  label={actions.editTitle}
                  icon={<Pencil />}
                  onClick={startEditingTitle}
                  className="size-8 rounded-[8px] border-transparent [&_svg]:size-[15px]"
                />
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge
              status={meeting.status}
              label={meetingStatusLabels[meeting.status]}
            />
            <span className="text-sand font-mono text-[13px]">
              {meeting.dateLabel} · {meeting.timeLabel} · {meeting.duration}
            </span>
            <span className="flex items-center gap-1.5">
              {meeting.modes.map(mode => (
                <ModeDot key={mode} mode={mode} />
              ))}
            </span>
            <MeetingTag label={meeting.tag} />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {exportItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(open => !open)}
                aria-expanded={menuOpen}
                className="border-line-2 hover:bg-ink-3 text-cream inline-flex items-center gap-2 rounded-[12px] border px-4 py-3 text-[14px] font-semibold transition-colors [&_svg]:size-[16px]"
              >
                <Download />
                {actions.export}
                <ChevronDown
                  className={cn(
                    'transition-transform',
                    menuOpen && 'rotate-180'
                  )}
                />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="border-line bg-ink-2 absolute right-0 z-50 mt-2 w-56 rounded-[12px] border p-1.5 shadow-xl">
                    {exportItems.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          item.onSelect();
                          setMenuOpen(false);
                        }}
                        className="text-sand hover:bg-ink-3 hover:text-cream flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors [&_svg]:size-[16px]"
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {isStored &&
            (confirmingDelete ? (
              <div className="border-line-2 bg-ink-2 flex items-center gap-2 rounded-[12px] border py-1.5 pr-1.5 pl-3.5">
                <span className="text-sand text-[13px]">
                  {actions.deleteConfirm}
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-mic text-ink rounded-[8px] px-3 py-1.5 text-[13px] font-semibold"
                >
                  {actions.deleteConfirmYes}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-sand hover:text-cream rounded-[8px] px-2 py-1.5 text-[13px] font-medium transition-colors"
                >
                  {actions.deleteCancel}
                </button>
              </div>
            ) : (
              <IconButton
                label={actions.delete}
                icon={<Trash2 />}
                onClick={() => setConfirmingDelete(true)}
              />
            ))}
        </div>
      </div>
    </header>
  );
};
