import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { logger } from "@/lib/logger";
import type { AdminClient } from "@/lib/supabase/admin";

type BoardSeed = { adapter: string; boardToken: string; companyName?: string };

function readSeedBoards(): BoardSeed[] {
  const path = resolve(process.cwd(), "data/ats-boards.de.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: BoardSeed[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.adapter !== "string" || typeof rec.boardToken !== "string") continue;
    out.push({
      adapter: rec.adapter,
      boardToken: rec.boardToken,
      companyName: typeof rec.companyName === "string" ? rec.companyName : undefined,
    });
  }
  return out;
}

/**
 * Board tokens live in `data/ats-boards.de.json` (checked into the repo), but the
 * pipeline reads enabled boards from the `job_boards` table so it can track health
 * (`last_ok_at`, `consecutive_failures`) per token. This inserts any tokens missing
 * from the table and never overwrites rows that already exist, so a manual
 * disable or accumulated failure count is never clobbered by a re-run.
 */
export async function seedBoardsFromRegistry(admin: AdminClient): Promise<void> {
  const seeds = readSeedBoards().filter((s) => s.adapter !== "arbeitnow");
  if (seeds.length === 0) return;

  const rows = seeds.map((s) => ({
    adapter: s.adapter,
    board_token: s.boardToken,
    company_name: s.companyName ?? null,
  }));

  const { error } = await admin
    .from("job_boards")
    .upsert(rows, { onConflict: "adapter,board_token", ignoreDuplicates: true });
  if (error) {
    logger.warn("board seed failed", { error: error.message });
  }
}
