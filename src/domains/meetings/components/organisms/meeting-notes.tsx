'use client';

import { useState } from 'react';
import { NotesTabs } from '../molecules/notes-tabs';
import { AiNotesPanel } from './ai-notes-panel';
import { NotesGenerator } from './notes-generator';
import { TranscriptPanel } from './transcript-panel';
import { updateStoredMeetingNotes } from '../../services/meetings-repository.service';
import { meetingDetailMessages } from '../../messages';
import type {
  MeetingNotes,
  NotesTab,
  TranscriptTurn
} from '../../types/meeting-detail.types';

type MeetingNotesSectionProps = {
  meetingId: string;
  notes: MeetingNotes;
  transcript: TranscriptTurn[];
  /** Only persisted meetings can generate + save notes. */
  isStored: boolean;
};

const notesAreEmpty = (notes: MeetingNotes): boolean =>
  notes.summary.trim().length === 0 &&
  notes.keyPoints.length === 0 &&
  notes.actionItems.length === 0 &&
  notes.decisions.length === 0;

export const MeetingNotesSection = ({
  meetingId,
  notes: initialNotes,
  transcript,
  isStored
}: MeetingNotesSectionProps) => {
  const [activeTab, setActiveTab] = useState<NotesTab>('notes');
  const [notes, setNotes] = useState<MeetingNotes>(initialNotes);

  const handleGenerated = (generated: MeetingNotes) => {
    setNotes(generated);
    void updateStoredMeetingNotes(meetingId, generated);
  };

  const canGenerate = isStored && transcript.length > 0 && notesAreEmpty(notes);

  const renderNotes = () => {
    if (!notesAreEmpty(notes)) return <AiNotesPanel notes={notes} />;
    if (canGenerate) {
      return (
        <NotesGenerator transcript={transcript} onGenerated={handleGenerated} />
      );
    }
    return (
      <p className="text-sand-2 border-line rounded-card border border-dashed py-12 text-center text-[14px]">
        {meetingDetailMessages.notesEmpty}
      </p>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <NotesTabs
        active={activeTab}
        labels={meetingDetailMessages.tabs}
        onChange={setActiveTab}
      />
      {activeTab === 'notes' ? (
        renderNotes()
      ) : (
        <TranscriptPanel transcript={transcript} />
      )}
    </div>
  );
};
