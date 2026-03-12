import React from "react";

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

export function Label({ children, className }: LabelProps) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {children}
    </label>
  );
}
