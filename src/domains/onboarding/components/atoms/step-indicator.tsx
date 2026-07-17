import { cn } from '@/lib/utils';

type StepIndicatorProps = {
  totalSteps: number;
  activeIndex: number;
};

export const StepIndicator = ({
  totalSteps,
  activeIndex
}: StepIndicatorProps) => (
  <div aria-hidden="true" className="onboarding-step-indicator">
    {Array.from({ length: totalSteps }, (_, index) => (
      <span
        key={index}
        className={cn(
          'onboarding-step-indicator__dot',
          index === activeIndex && 'onboarding-step-indicator__dot--active'
        )}
      />
    ))}
  </div>
);
