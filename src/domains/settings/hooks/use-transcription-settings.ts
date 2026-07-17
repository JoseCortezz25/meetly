'use client';

import { useEffect, useState } from 'react';
import type { ASRModel } from 'browser-whisper';
import {
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_TRANSCRIPTION_MODEL,
  getTranscriptionLanguage,
  getTranscriptionModel,
  setTranscriptionLanguage,
  setTranscriptionModel
} from '@/lib/transcription-settings';

export const useTranscriptionSettings = () => {
  // Start from the defaults on both server and client, then hydrate from storage
  // in an effect to avoid a hydration mismatch.
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE_CODE);
  const [model, setModelState] = useState<ASRModel>(
    DEFAULT_TRANSCRIPTION_MODEL
  );

  useEffect(() => {
    setLanguageState(getTranscriptionLanguage());
    setModelState(getTranscriptionModel());
  }, []);

  const setLanguage = (code: string) => {
    setTranscriptionLanguage(code);
    setLanguageState(code);
  };

  const setModel = (nextModel: ASRModel) => {
    setTranscriptionModel(nextModel);
    setModelState(nextModel);
  };

  return { language, setLanguage, model, setModel };
};
