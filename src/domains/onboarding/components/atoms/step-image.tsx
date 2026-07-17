import { ImageIcon } from 'lucide-react';

type StepImageProps = {
  src?: string;
  alt: string;
  placeholderLabel: string;
};

export const StepImage = ({ src, alt, placeholderLabel }: StepImageProps) => {
  if (src) {
    return <img src={src} alt={alt} className="onboarding-step-image" />;
  }

  return (
    <div
      role="img"
      aria-label={placeholderLabel}
      className="onboarding-step-image onboarding-step-image--placeholder"
    >
      <ImageIcon className="size-8" />
      <span>{placeholderLabel}</span>
    </div>
  );
};
