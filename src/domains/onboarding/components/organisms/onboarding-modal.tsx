'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { onboardingSteps } from '../../content/onboarding-steps';
import { useOnboarding } from '../../hooks/use-onboarding';
import { onboardingMessages } from '../../messages';
import { StepImage } from '../atoms/step-image';
import { OnboardingStepPanel } from '../molecules/onboarding-step-panel';

export const OnboardingModal = () => {
  const {
    isOpen,
    stepIndex,
    isFirstStep,
    isLastStep,
    handleNext,
    handleBack,
    handleSkip,
    handleComplete
  } = useOnboarding(onboardingSteps.length);
  const panelRef = useRef<HTMLDivElement>(null);
  const messages = onboardingMessages;

  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSkip]);

  if (!isOpen) return null;

  const step = onboardingSteps[stepIndex];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        aria-label={messages.actions.skip}
        onClick={handleSkip}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-step-title"
        tabIndex={-1}
        className="border-line bg-ink-2 relative z-[1] my-auto grid w-full max-w-[860px] grid-cols-1 overflow-hidden rounded-[18px] border shadow-2xl outline-none md:grid-cols-[1.1fr_1fr]"
      >
        <div className="flex flex-col p-5 sm:p-7 md:p-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sand-2 text-[11px] font-semibold tracking-[1px] uppercase">
              {messages.stepProgress(stepIndex + 1, onboardingSteps.length)}
            </p>
            <button
              type="button"
              onClick={handleSkip}
              className="onboarding-modal__skip"
            >
              {messages.actions.skip}
            </button>
          </div>

          <OnboardingStepPanel
            title={step.title}
            description={step.description}
            stepIndex={stepIndex}
            totalSteps={onboardingSteps.length}
          />

          <div className="mt-auto flex items-center justify-end gap-3 pt-7">
            {!isFirstStep && (
              <button
                type="button"
                onClick={handleBack}
                className="onboarding-modal__button onboarding-modal__button--ghost"
              >
                {messages.actions.back}
              </button>
            )}
            <button
              type="button"
              onClick={isLastStep ? handleComplete : handleNext}
              className="onboarding-modal__button onboarding-modal__button--primary"
            >
              {isLastStep ? messages.actions.getStarted : messages.actions.next}
            </button>
          </div>
        </div>

        <div className="border-line bg-ink-3 flex aspect-[16/10] items-stretch border-t md:aspect-auto md:min-h-[380px] md:border-t-0 md:border-l">
          <StepImage
            src={step.image}
            alt={step.title}
            placeholderLabel={messages.imagePlaceholder}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
