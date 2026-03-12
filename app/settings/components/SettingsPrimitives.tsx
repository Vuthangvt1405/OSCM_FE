"use client";

import type { ComponentType, ReactNode } from "react";
import { Switch } from "@/components/ui/switch";

export function SettingsCard({
  title,
  description,
  Icon,
  children,
}: {
  title: string;
  description?: string;
  Icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        connected
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div
          className={`text-sm font-medium ${
            disabled ? "text-slate-400" : "text-slate-900"
          }`}
        >
          {label}
        </div>
        {description ? (
          <div
            className={`mt-1 text-sm ${disabled ? "text-slate-400" : "text-slate-500"}`}
          >
            {description}
          </div>
        ) : null}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

