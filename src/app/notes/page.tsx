import { NotesList } from '@/domains/meetings/components/organisms/notes-list';
import { getMeetingNotesList } from '@/domains/meetings/data/meeting-detail.mock';

export default function NotesPage() {
  return (
    <main className="relative z-[2] mx-auto max-w-[1180px] px-[34px] pt-[26px] pb-[80px]">
      <NotesList meetings={getMeetingNotesList()} />
    </main>
  );
}
