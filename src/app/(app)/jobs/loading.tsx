function JobSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-14 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-4 h-9 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export default function JobsLoading() {
  return (
    <div className="space-y-6" aria-label="Loading jobs">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="hidden rounded-2xl border border-border bg-card p-5 lg:block">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <JobSkeleton />
          <JobSkeleton />
          <JobSkeleton />
          <JobSkeleton />
        </div>
      </div>
    </div>
  );
}
