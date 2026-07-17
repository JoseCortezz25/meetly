import { StepIndicator } from '../atoms/step-indicator';

type OnboardingStepPanelProps = {
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
};

export const OnboardingStepPanel = ({
  title,
  description,
  stepIndex,
  totalSteps
}: OnboardingStepPanelProps) => (
  <div className="flex flex-col">
    <h2
      id="onboarding-step-title"
      className="font-display text-cream text-[24px] font-medium tracking-[-0.3px] sm:text-[26px]"
    >
      {title}
    </h2>
    <p className="text-sand mt-2.5 text-[14px] leading-[1.6]">{description}</p>
    <div className="mt-5">
      <StepIndicator totalSteps={totalSteps} activeIndex={stepIndex} />
    </div>
  </div>
);
