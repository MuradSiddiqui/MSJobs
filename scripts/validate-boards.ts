import { loadScriptEnv } from "./load-env";
import { probeAdapter } from "../src/lib/ingestion/probe";
import { adapterByName } from "../src/lib/ingestion/pipeline";
import { getAdminClient } from "../src/lib/supabase/admin";

async function main() {
  loadScriptEnv();
  const admin = getAdminClient();
  const { data: boards, error } = await admin
    .from("job_boards")
    .select("adapter, board_token, company_name, enabled")
    .order("adapter")
    .order("board_token");
  if (error) throw error;

  const rows: Array<{
    adapter: string;
    token: string;
    company: string;
    enabled: boolean;
    status: string;
    jobs: number;
    note: string;
  }> = [];

  for (const board of boards ?? []) {
    const adapter = adapterByName(board.adapter);
    if (!adapter) {
      rows.push({
        adapter: board.adapter,
        token: board.board_token,
        company: board.company_name ?? "",
        enabled: board.enabled,
        status: "error",
        jobs: 0,
        note: "unknown adapter",
      });
      continue;
    }
    const result = await probeAdapter(adapter, {
      boardToken: board.board_token === "default" ? undefined : board.board_token,
      companyName: board.company_name ?? undefined,
    });
    const note =
      result.status === "retire"
        ? "404 — retire (not auto-disabled)"
        : result.status === "empty"
          ? "alive, empty — keep polling"
          : result.status === "backoff"
            ? "bot-protection — back off"
            : result.status === "ok"
              ? (result.sampleTitle ?? "jobs found")
              : (result.error ?? "probe failed");
    rows.push({
      adapter: board.adapter,
      token: board.board_token,
      company: board.company_name ?? "",
      enabled: board.enabled,
      status: result.status,
      jobs: result.jobCount,
      note,
    });
  }

  console.table(rows);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
