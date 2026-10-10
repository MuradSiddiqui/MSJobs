import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-14 text-center",
        className,
      )}
    >
      <p className="font-display text-base font-medium tracking-tight">{title}</p>
      {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      <div className="h-4 w-1/3 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
