'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'error';

const DEFAULT_RESET_MS = 2000;

/**
 * Writes text to the clipboard and exposes a transient status ('copied' /
 * 'error') that auto-resets, so a button can show feedback without owning a
 * timer. Generic — not tied to any specific content.
 */
export const useCopyToClipboard = (resetMs = DEFAULT_RESET_MS) => {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timeoutRef = useRef<number | null>(null);

  const clearPending = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => clearPending, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(text);
        setStatus('copied');
      } catch {
        setStatus('error');
      }
      clearPending();
      timeoutRef.current = window.setTimeout(() => setStatus('idle'), resetMs);
    },
    [resetMs]
  );

  return { copy, status };
};
