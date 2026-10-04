import { JOB_SOURCE_NAMES, type JobSourceName, type NormalizedJob } from "@/lib/core/types";
import { logger } from "@/lib/logger";
import { acquireLock, releaseLock } from "@/lib/ingestion/lock";
import { bumpCounters, finishRun, startRun } from "@/lib/ingestion/run-log";
import { loadOnboardedUsers, scoreJobsForUsers } from "@/lib/ingestion/stages/match";
import { deactivateUnseenJobs, upsertJob } from "@/lib/ingestion/stages/upsert";
import { seedBoardsFromRegistry } from "@/lib/ingestion/seed-boards";
import { enabledAdapters, getAdapter } from "@/lib/sources/registry";
import type { JobSourceAdapter, SourceContext } from "@/lib/sources/types";
import { getAdminClient, type AdminClient } from "@/lib/supabase/admin";

const GLOBAL_LOCK = "ingest:global";
const LOCK_TTL_MS = 30 * 60 * 1000;

export type SourceRunSummary = {
  source: string;
  fetched: number;
  created: number;
  updated: number;
  failed: number;
  error?: string;
};

export type IngestionSummary = {
  skipped?: boolean;
  sources: SourceRunSummary[];
  ok: boolean;
};

type BoardRow = {
  adapter: string;
  board_token: string;
  company_name: string | null;
  enabled: boolean;
};

function isJobSourceName(value: string): value is JobSourceName {
  return (JOB_SOURCE_NAMES as readonly string[]).includes(value);
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const rec = err as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts = [rec.message, rec.code, rec.details, rec.hint]
      .filter((v) => typeof v === "string" && v.length > 0)
      .map(String);
    if (parts.length) return parts.join(" · ");
  }
  return String(err);
}

async function loadBoards(admin: AdminClient, adapter: string): Promise<BoardRow[]> {
  const { data, error } = await admin
    .from("job_boards")
    .select("adapter, board_token, company_name, enabled")
    .eq("adapter", adapter)
    .eq("enabled", true);
  if (error) throw error;
  return data ?? [];
}

async function touchBoard(
  admin: AdminClient,
  adapter: string,
  token: string,
  ok: boolean,
  error?: string,
): Promise<void> {
  const { data: board, error: readError } = await admin
    .from("job_boards")
    .select("id, consecutive_failures")
    .eq("adapter", adapter)
    .eq("board_token", token)
    .maybeSingle();
  if (readError) throw readError;
  if (!board) return;

  const { error: updateError } = await admin
    .from("job_boards")
    .update(
      ok
        ? { last_ok_at: new Date().toISOString(), consecutive_failures: 0, last_error: null }
        : { consecutive_failures: board.consecutive_failures + 1, last_error: error ?? "unknown" },
    )
    .eq("id", board.id);
  if (updateError) throw updateError;
}

async function ingestBoard(
  admin: AdminClient,
  adapter: JobSourceAdapter,
  ctx: SourceContext,
  sourceLabel: string,
): Promise<SourceRunSummary> {
  const runId = await startRun(admin, sourceLabel);
  const seenSourceJobIds = new Set<string>();
  const changed: { jobId: string; normalized: NormalizedJob }[] = [];
  const summary: SourceRunSummary = { source: sourceLabel, fetched: 0, created: 0, updated: 0, failed: 0 };

  try {
    for await (const stub of adapter.listJobs(ctx, { boardToken: ctx.boardToken, maxPages: 8 })) {
      summary.fetched += 1;
      seenSourceJobIds.add(stub.sourceJobId);
      try {
        const normalized = adapter.normalize(stub);
        const result = await upsertJob(admin, normalized);
        if (result.created) summary.created += 1;
        else summary.updated += 1;
        changed.push({ jobId: result.jobId, normalized });
      } catch (err) {
        summary.failed += 1;
        logger.warn("job upsert failed", { source: sourceLabel, sourceJobId: stub.sourceJobId, error: errorMessage(err) });
      }
    }

    await deactivateUnseenJobs(admin, adapter.name, seenSourceJobIds);
    const users = await loadOnboardedUsers(admin);
    await scoreJobsForUsers(admin, changed, users);
    await bumpCounters(admin, runId, {
      jobs_fetched: summary.fetched,
      jobs_created: summary.created,
      jobs_updated: summary.updated,
      jobs_failed: summary.failed,
    });
    await finishRun(admin, runId, { status: "succeeded" });
    logger.info("source ingest succeeded", { ...summary });
  } catch (err) {
    summary.error = errorMessage(err);
    logger.error("source ingest failed", { source: sourceLabel, error: summary.error });
    try {
      await bumpCounters(admin, runId, {
        jobs_fetched: summary.fetched,
        jobs_created: summary.created,
        jobs_updated: summary.updated,
        jobs_failed: summary.failed,
      });
      await finishRun(admin, runId, { status: "failed", error: summary.error });
    } catch (finishErr) {
      logger.error("failed to record run", { source: sourceLabel, error: errorMessage(finishErr) });
    }
  }

  return summary;
}

export async function runIngestion(opts?: { sources?: string[] }): Promise<IngestionSummary> {
  const admin = getAdminClient();
  const holder = `ingest:${process.pid}:${Date.now()}`;
  const got = await acquireLock(admin, GLOBAL_LOCK, LOCK_TTL_MS, holder);
  if (!got) {
    logger.warn("ingestion lock held", { key: GLOBAL_LOCK });
    return { skipped: true, sources: [], ok: true };
  }

  await seedBoardsFromRegistry(admin);

  const allow = opts?.sources?.map((s) => s.toLowerCase());
  let adapters = enabledAdapters();
  if (allow?.length) adapters = adapters.filter((a) => allow.includes(a.name));

  const sources: SourceRunSummary[] = [];
  try {
    for (const adapter of adapters) {
      if (adapter.requiresBoardToken) {
        const boards = await loadBoards(admin, adapter.name);
        if (boards.length === 0) {
          logger.info("no enabled boards", { adapter: adapter.name });
          continue;
        }
        for (const board of boards) {
          const label = `${adapter.name}:${board.board_token}`;
          const summary = await ingestBoard(admin, adapter, {
            boardToken: board.board_token,
            companyName: board.company_name ?? undefined,
          }, label);
          sources.push(summary);
          await touchBoard(admin, adapter.name, board.board_token, !summary.error, summary.error);
        }
      } else {
        const summary = await ingestBoard(admin, adapter, {}, adapter.name);
        sources.push(summary);
        await touchBoard(admin, adapter.name, "default", !summary.error, summary.error);
      }
    }
  } finally {
    await releaseLock(admin, GLOBAL_LOCK, holder);
  }

  return { sources, ok: sources.every((s) => !s.error) };
}

export function adapterByName(name: string): JobSourceAdapter | null {
  if (!isJobSourceName(name)) return null;
  try {
    return getAdapter(name);
  } catch {
    return null;
  }
}
