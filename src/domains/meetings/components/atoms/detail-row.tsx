import type { ReactNode } from 'react';

type DetailRowProps = {
  label: string;
  children: ReactNode;
};

export const DetailRow = ({ label, children }: DetailRowProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sand text-[14px]">{label}</span>
      <span className="text-cream text-[14px] font-medium">{children}</span>
    </div>
  );
};
