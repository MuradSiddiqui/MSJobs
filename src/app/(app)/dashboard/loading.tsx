function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
    </div>
  );
}

function JobSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <div>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <JobSkeleton />
          <JobSkeleton />
          <JobSkeleton />
        </div>
      </div>
    </div>
  );
}
