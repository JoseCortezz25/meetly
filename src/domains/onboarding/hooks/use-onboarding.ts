'use client';

import { useEffect, useState } from 'react';

const ONBOARDING_STORAGE_KEY = 'meetly.onboarding.completed';

/**
 * First-run onboarding logic: SSR-safe localStorage check plus step
 * navigation. The modal only opens after the client-side check resolves,
 * so the server render and hydration never disagree.
 */
export const useOnboarding = (totalSteps: number) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const hasCompleted =
      localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    if (!hasCompleted) setIsOpen(true);
  }, []);

  const close = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  };

  const handleNext = () =>
    setStepIndex(index => Math.min(index + 1, totalSteps - 1));
  const handleBack = () => setStepIndex(index => Math.max(index - 1, 0));
  const handleSkip = () => close();
  const handleComplete = () => close();

  return {
    isOpen,
    stepIndex,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === totalSteps - 1,
    handleNext,
    handleBack,
    handleSkip,
    handleComplete
  };
};
