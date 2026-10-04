import { loadScriptEnv } from "./load-env";
import { runIngestion } from "../src/lib/ingestion/pipeline";
import { logger } from "../src/lib/logger";

/**
 * Runs ingestion immediately, then repeats on an interval, so new jobs keep
 * arriving while this process stays open — no need to re-run `npm run ingest`
 * by hand. Stop with Ctrl+C. For "always on even when my laptop is off",
 * deploy and use the GitHub Actions cron in `.github/workflows/ingest.yml`
 * instead (runs every 2 hours against a hosted Supabase project).
 */

function parseIntervalMinutes(): number {
  const fromArg = process.argv.slice(2).find((a) => /^\d+$/.test(a));
  const raw = fromArg ?? process.env.INGEST_INTERVAL_MINUTES ?? "60";
  const minutes = Number(raw);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce(): Promise<void> {
  const startedAt = new Date().toISOString();
  try {
    const summary = await runIngestion();
    if (summary.skipped) {
      console.log(`[${startedAt}] skipped (lock held by another run)`);
      return;
    }
    const line = summary.sources
      .map(
        (s) =>
          `${s.source}: fetched=${s.fetched} created=${s.created} updated=${s.updated} failed=${s.failed}${
            s.error ? ` error=${s.error}` : ""
          }`,
      )
      .join(" | ");
    console.log(`[${startedAt}] ${line || "no sources ran"}`);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
    console.error(`[${startedAt}] ingest failed:`, message, err);
    logger.error("ingest loop run failed", { error: message });
  }
}

async function main() {
  loadScriptEnv();
  const minutes = parseIntervalMinutes();
  console.log(`Ingest loop started. Running every ${minutes} minute(s). Press Ctrl+C to stop.`);

  let stopping = false;
  process.on("SIGINT", () => {
    stopping = true;
    console.log("\nStopping ingest loop…");
    process.exit(0);
  });

  while (!stopping) {
    await runOnce();
    await sleep(minutes * 60 * 1000);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
