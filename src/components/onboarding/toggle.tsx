"use client";

import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#E4E0D3] bg-white px-4 py-3.5 text-left transition-colors hover:border-[#0E7490] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]/40"
    >
      <span>
        <span className="block text-sm font-medium text-[#1E2A3A]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-[#667085]">{description}</span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
          checked ? "bg-[#0E7490]" : "bg-[#E4E0D3]",
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}
