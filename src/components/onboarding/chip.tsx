"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  selected,
  onToggle,
  children,
  className,
}: {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        selected
          ? "border-accent bg-accent text-white"
          : "border-border bg-card text-foreground hover:border-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}
