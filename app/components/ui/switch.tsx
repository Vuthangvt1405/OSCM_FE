import React from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Switch({
  checked,
  onCheckedChange,
  className,
  disabled,
}: SwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-slate-200"
      } ${className}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
