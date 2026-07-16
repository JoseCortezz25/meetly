type MeetingTagProps = {
  label: string;
};

export const MeetingTag = ({ label }: MeetingTagProps) => {
  return (
    <span className="border-line-2 text-sand rounded-full border px-3 py-1 text-[12.5px]">
      {label}
    </span>
  );
};
