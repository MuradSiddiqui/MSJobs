function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-5 h-3 w-full animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-muted" />
    </div>
  );
}

export default function AppLoading() {
  return (
    <div className="space-y-6" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
