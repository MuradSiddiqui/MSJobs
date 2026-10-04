import { loadScriptEnv } from "./load-env";
import { runIngestion } from "../src/lib/ingestion/pipeline";
import { logger } from "../src/lib/logger";

async function main() {
  loadScriptEnv();
  const summary = await runIngestion();
  const line = summary.skipped
    ? "skipped (lock held)"
    : summary.sources
        .map((s) => `${s.source}: fetched=${s.fetched} created=${s.created} updated=${s.updated} failed=${s.failed}${s.error ? ` error=${s.error}` : ""}`)
        .join("\n");
  console.log(line || "no sources ran");
  logger.info("ingest finished", { skipped: summary.skipped ?? false, ok: summary.ok, sources: summary.sources.length });
  process.exit(summary.ok ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
