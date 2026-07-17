'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_NOTES_MODEL_ID,
  getNotesModelId,
  setNotesModelId
} from '@/lib/notes-settings';

export const useNotesSettings = () => {
  // Start from the default on both server and client, then hydrate from storage
  // in an effect to avoid a hydration mismatch.
  const [model, setModelState] = useState<string>(DEFAULT_NOTES_MODEL_ID);

  useEffect(() => {
    setModelState(getNotesModelId());
  }, []);

  const setModel = (id: string) => {
    setNotesModelId(id);
    setModelState(id);
  };

  return { model, setModel };
};
