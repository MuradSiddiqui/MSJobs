import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadScriptEnv } from "./load-env";
import { adapterByName } from "../src/lib/ingestion/pipeline";
import { probeAdapter } from "../src/lib/ingestion/probe";

type BoardCandidate = {
  adapter: string;
  boardToken: string;
  companyName: string;
};

function readCandidates(): BoardCandidate[] {
  const path = resolve(process.cwd(), "data/ats-boards.de.json");
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("data/ats-boards.de.json must be an array");
  const out: BoardCandidate[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.adapter !== "string" || typeof rec.boardToken !== "string") continue;
    out.push({
      adapter: rec.adapter,
      boardToken: rec.boardToken,
      companyName: typeof rec.companyName === "string" ? rec.companyName : rec.boardToken,
    });
  }
  return out;
}

async function main() {
  loadScriptEnv();
  const apply = process.argv.includes("--apply");
  if (apply) {
    console.log("--apply is not implemented; printing probe results only.");
  }

  const hits: Array<{
    adapter: string;
    token: string;
    company: string;
    status: string;
    jobs: number;
    sample?: string;
  }> = [];

  for (const candidate of readCandidates()) {
    const adapter = adapterByName(candidate.adapter);
    if (!adapter) {
      console.warn(`skip unknown adapter ${candidate.adapter} (${candidate.boardToken})`);
      continue;
    }
    const result = await probeAdapter(adapter, {
      boardToken: candidate.boardToken === "default" ? undefined : candidate.boardToken,
      companyName: candidate.companyName,
    });
    if (result.status === "ok") {
      hits.push({
        adapter: candidate.adapter,
        token: candidate.boardToken,
        company: candidate.companyName,
        status: result.status,
        jobs: result.jobCount,
        sample: result.sampleTitle,
      });
    } else {
      console.log(
        `${candidate.adapter}:${candidate.boardToken} -> ${result.status}${result.error ? ` (${result.error})` : ""}`,
      );
    }
  }

  console.log("\nDE-relevant hits:");
  console.table(hits);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
