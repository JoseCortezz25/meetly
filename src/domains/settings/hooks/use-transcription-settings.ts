'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_LANGUAGE_CODE,
  getTranscriptionLanguage,
  setTranscriptionLanguage
} from '@/lib/transcription-settings';

export const useTranscriptionSettings = () => {
  // Start from the default on both server and client, then hydrate from storage
  // in an effect to avoid a hydration mismatch.
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE_CODE);

  useEffect(() => {
    setLanguageState(getTranscriptionLanguage());
  }, []);

  const setLanguage = (code: string) => {
    setTranscriptionLanguage(code);
    setLanguageState(code);
  };

  return { language, setLanguage };
};
