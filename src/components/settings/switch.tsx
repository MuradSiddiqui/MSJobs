"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked?: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (next: boolean) => void;
};

/**
 * Small accessible toggle. Used for display-only settings switches and the
 * local-state notification switches. Never wired to persistence here.
 */
export function Switch({ checked = false, disabled = false, label, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-accent" : "bg-muted",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
