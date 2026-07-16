import { Info } from 'lucide-react';

type CaptureHintProps = {
  text: string;
};

export const CaptureHint = ({ text }: CaptureHintProps) => {
  return (
    <p className="text-sand mt-5 flex items-center justify-center gap-2 text-center text-[12.5px]">
      <Info className="text-sys size-3.5 shrink-0" />
      <span>{text}</span>
    </p>
  );
};
