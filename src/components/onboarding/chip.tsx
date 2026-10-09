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
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]/40",
        selected
          ? "border-[#0E7490] bg-[#0E7490] text-white"
          : "border-[#E4E0D3] bg-white text-[#1E2A3A] hover:border-[#0E7490]",
        className,
      )}
    >
      {children}
    </button>
  );
}
