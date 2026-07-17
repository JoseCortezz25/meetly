import { NotesList } from '@/domains/meetings/components/organisms/notes-list';

export default function NotesPage() {
  return (
    <main className="relative z-[2] mx-auto max-w-[1180px] px-4 pt-[26px] pb-[80px] sm:px-[34px]">
      <NotesList />
    </main>
  );
}
