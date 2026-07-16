type MeetingNameFieldProps = {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const MeetingNameField = ({
  value,
  placeholder,
  ariaLabel,
  onChange,
  disabled
}: MeetingNameFieldProps) => {
  return (
    <input
      type="text"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      className="font-display placeholder:text-sand-2 text-cream w-full bg-transparent text-[28px] font-medium tracking-[-0.5px] focus:outline-none disabled:opacity-60"
    />
  );
};
