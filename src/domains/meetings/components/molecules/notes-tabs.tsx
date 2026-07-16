import { cn } from '@/lib/utils';
import type { NotesTab } from '../../types/meeting-detail.types';

type NotesTabsProps = {
  active: NotesTab;
  labels: { notes: string; transcript: string };
  onChange: (tab: NotesTab) => void;
};

export const NotesTabs = ({ active, labels, onChange }: NotesTabsProps) => {
  const tabs: { key: NotesTab; label: string }[] = [
    { key: 'notes', label: labels.notes },
    { key: 'transcript', label: labels.transcript }
  ];

  return (
    <div className="border-line bg-ink-2 inline-flex gap-1 self-start rounded-full border p-1.5">
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          aria-pressed={active === tab.key}
          className={cn(
            'rounded-full px-5 py-2 text-[14px] font-semibold transition-colors',
            active === tab.key
              ? 'bg-cream text-ink'
              : 'text-sand hover:text-cream'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
