"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { applyAndTrack } from "@/server/jobs";
import type { ApplyQueueItem } from "@/server/jobs";
import { ArrowRight, Check, ExternalLink, FastForward, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 36e5);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export function ApplyQueueRunner({ queue }: { queue: ApplyQueueItem[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [applied, setApplied] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const current = queue[index] ?? null;
  const total = queue.length;
  const progress = total > 0 ? ((applied + skipped) / total) * 100 : 0;

  const next = useCallback(() => {
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, total]);

  const handleApply = useCallback(async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const result = await applyAndTrack(current.jobId);
      if (!result.ok) {
        toast.error(result.error);
        setBusy(false);
        return;
      }
      window.open(current.applyUrl, "_blank", "noopener,noreferrer");
      setApplied((n) => n + 1);
      toast.success(`Applied to ${current.title} — finish the form in the new tab`);
      next();
    } catch {
      toast.error("Could not track application");
    } finally {
      setBusy(false);
    }
  }, [current, busy, next]);

  const handleSkip = useCallback(() => {
    setSkipped((n) => n + 1);
    next();
  }, [next]);

  // Keyboard shortcuts: A = apply, S = skip.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (e.key === "a" || e.key === "A") handleApply();
      if (e.key === "s" || e.key === "S") handleSkip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleApply, handleSkip, done]);

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Trophy className="h-8 w-8 text-accent" />
        </div>
        <h2 className="font-display text-3xl font-semibold">Queue complete</h2>
        <p className="mt-2 text-muted-foreground">
          You applied to <span className="font-semibold text-foreground">{applied}</span> of{" "}
          {total} roles
          {skipped > 0 && (
            <>
              {" "}(<span className="font-semibold text-foreground">{skipped}</span> skipped)
            </>
          )}
          . Volume wins — keep the momentum going.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => router.push("/applications")}>
            View applications <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => router.push("/jobs")}>
            Back to jobs
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">
            {index + 1} of {total}
          </span>
          <span className="text-muted-foreground">
            {applied} applied · {skipped} skipped
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {current.matchScore != null && (
            <Badge tone="accent">{Math.round(current.matchScore)}% match</Badge>
          )}
          {current.postedAt && (
            <span className="text-xs text-muted-foreground">
              Posted {relativeTime(current.postedAt)}
            </span>
          )}
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">{current.title}</h2>
        <p className="mt-1 text-muted-foreground">
          {current.company}
          {current.city ? ` · ${current.city}` : ""}
          {current.remoteType ? ` · ${current.remoteType}` : ""}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={handleApply} disabled={busy}>
            {busy ? (
              "Opening…"
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" /> Apply now{" "}
                <kbd className="ml-2 rounded bg-background/20 px-1.5 text-xs">A</kbd>
              </>
            )}
          </Button>
          <Button size="lg" variant="outline" onClick={handleSkip} disabled={busy}>
            <FastForward className="mr-2 h-4 w-4" /> Skip{" "}
            <kbd className="ml-2 rounded bg-muted px-1.5 text-xs">S</kbd>
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Apply opens the employer site in a new tab and tracks it automatically.
        </p>
      </div>

      <div className="mt-4 text-center">
        <Button variant="ghost" size="sm" onClick={() => setDone(true)}>
          <X className="mr-1 h-3 w-3" /> End queue early
        </Button>
      </div>
    </div>
  );
}

export function ApplyQueueSetup({
  onStart,
}: {
  onStart: (criteria: { minScore: number; freshOnly: boolean; maxJobs: number }) => void;
}) {
  const [minScore, setMinScore] = useState(70);
  const [freshOnly, setFreshOnly] = useState(true);
  const [maxJobs, setMaxJobs] = useState(25);

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold">Build your apply queue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We will line up the best matching roles. You power through them one by one.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Minimum match score: {minScore}%
            </label>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Max roles: {maxJobs}</label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={maxJobs}
              onChange={(e) => setMaxJobs(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={freshOnly}
              onChange={(e) => setFreshOnly(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span>
              <span className="font-medium">Fresh roles only</span>
              <span className="block text-xs text-muted-foreground">
                Posted in the last 7 days — apply while they are hot
              </span>
            </span>
          </label>
        </div>

        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={() => onStart({ minScore, freshOnly, maxJobs })}
        >
          <Check className="mr-2 h-4 w-4" /> Start auto-apply queue
        </Button>
      </div>
    </div>
  );
}
