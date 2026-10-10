"use client";

import { Button } from "@/components/ui/button";

export function YearsStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const clamp = (v: number) => Math.min(20, Math.max(0, Math.round(v * 2) / 2));
  const label = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Decrease years of experience"
        disabled={value <= 0}
        onClick={() => onChange(clamp(value - 0.5))}
      >
        <span aria-hidden className="text-lg leading-none">-</span>
      </Button>
      <span className="w-14 text-center text-lg font-semibold text-foreground" aria-live="polite">
        {label}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Increase years of experience"
        disabled={value >= 20}
        onClick={() => onChange(clamp(value + 0.5))}
      >
        <span aria-hidden className="text-lg leading-none">+</span>
      </Button>
      <span className="text-sm text-muted-foreground">years</span>
    </div>
  );
}
