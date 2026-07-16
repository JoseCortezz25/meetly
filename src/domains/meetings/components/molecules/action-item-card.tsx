'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionItem } from '../../types/meeting-detail.types';

type ActionItemCardProps = {
  item: ActionItem;
  ownerLabel: string;
};

export const ActionItemCard = ({ item, ownerLabel }: ActionItemCardProps) => {
  const [isDone, setIsDone] = useState(item.done);

  const metaParts: string[] = [];
  if (item.owner) metaParts.push(`${ownerLabel} ${item.owner}`);
  if (item.due) metaParts.push(item.due);
  const meta = metaParts.join(' · ');

  return (
    <label className="border-line bg-ink hover:border-line-2 flex cursor-pointer items-start gap-3.5 rounded-[12px] border p-4 transition-colors">
      <input
        type="checkbox"
        checked={isDone}
        onChange={event => setIsDone(event.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          'mt-[1px] grid size-[22px] shrink-0 place-items-center rounded-[7px] border transition-colors',
          isDone
            ? 'bg-ok text-ink border-transparent'
            : 'border-line-2 text-transparent'
        )}
        aria-hidden
      >
        <Check className="size-[14px]" strokeWidth={3} />
      </span>
      <span className="flex flex-col gap-1">
        <span
          className={cn(
            'text-[15px] font-medium transition-colors',
            isDone ? 'text-sand line-through' : 'text-cream'
          )}
        >
          {item.title}
        </span>
        {meta && (
          <span className="text-sand-2 font-mono text-[12.5px]">{meta}</span>
        )}
      </span>
    </label>
  );
};
