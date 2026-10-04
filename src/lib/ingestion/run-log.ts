import type { AdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/lib/supabase/database.types";

type IngestionStatus = Enums<"ingestion_status">;

export type RunCounters = {
  jobs_fetched?: number;
  jobs_created?: number;
  jobs_updated?: number;
  jobs_failed?: number;
};

export async function startRun(admin: AdminClient, source: string): Promise<string> {
  const { data, error } = await admin
    .from("ingestion_runs")
    .insert({ source, status: "running" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function bumpCounters(admin: AdminClient, runId: string, delta: RunCounters): Promise<void> {
  const { data, error } = await admin
    .from("ingestion_runs")
    .select("jobs_fetched, jobs_created, jobs_updated, jobs_failed")
    .eq("id", runId)
    .single();
  if (error) throw error;

  const { error: updateError } = await admin
    .from("ingestion_runs")
    .update({
      jobs_fetched: data.jobs_fetched + (delta.jobs_fetched ?? 0),
      jobs_created: data.jobs_created + (delta.jobs_created ?? 0),
      jobs_updated: data.jobs_updated + (delta.jobs_updated ?? 0),
      jobs_failed: data.jobs_failed + (delta.jobs_failed ?? 0),
    })
    .eq("id", runId);
  if (updateError) throw updateError;
}

export async function finishRun(
  admin: AdminClient,
  runId: string,
  input: {
    status: Exclude<IngestionStatus, "running">;
    error?: string | null;
    counters?: RunCounters;
  },
): Promise<void> {
  if (input.counters) await bumpCounters(admin, runId, input.counters);
  const { error } = await admin
    .from("ingestion_runs")
    .update({
      status: input.status,
      finished_at: new Date().toISOString(),
      error: input.error ?? null,
    })
    .eq("id", runId);
  if (error) throw error;
}
