"use client";

import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { ApplyQueueRunner, ApplyQueueSetup } from "@/components/jobs/apply-queue";
import { buildApplyQueue, type ApplyQueueItem } from "@/server/jobs";
import { toast } from "sonner";
import { Zap } from "lucide-react";

export default function AutoApplyPage() {
  const [queue, setQueue] = useState<ApplyQueueItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStart(criteria: { minScore: number; freshOnly: boolean; maxJobs: number }) {
    setLoading(true);
    try {
      const result = await buildApplyQueue(criteria);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.queue.length === 0) {
        toast.info("No matching roles found — try lowering the match score");
        return;
      }
      setQueue(result.queue);
      toast.success(`${result.queue.length} roles queued — let's go`);
    } catch {
      toast.error("Could not build queue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Auto-Apply Queue"
        description="Power through your best matches one by one. Volume wins."
      />
      {loading ? (
        <div className="mx-auto max-w-lg py-16 text-center">
          <Zap className="mx-auto mb-4 h-8 w-8 animate-pulse text-accent" />
          <p className="text-muted-foreground">Building your queue…</p>
        </div>
      ) : queue ? (
        queue.length === 0 ? (
          <EmptyState
            title="Queue is empty"
            description="No roles matched your criteria. Adjust the filters and try again."
          />
        ) : (
          <ApplyQueueRunner queue={queue} />
        )
      ) : (
        <ApplyQueueSetup onStart={handleStart} />
      )}
    </div>
  );
}
