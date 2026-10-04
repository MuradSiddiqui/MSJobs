import type { JobSourceAdapter, SourceContext } from "@/lib/sources/types";

export type BoardHealth = "ok" | "empty" | "retire" | "backoff" | "error";

export type ProbeResult = {
  status: BoardHealth;
  jobCount: number;
  sampleTitle?: string;
  error?: string;
};

function classifyError(err: unknown): Exclude<BoardHealth, "ok" | "empty"> {
  const msg = err instanceof Error ? err.message : String(err);
  if (/bot protection/i.test(msg) || /\b429\b/.test(msg) || /checkpoint/i.test(msg)) return "backoff";
  if (/\b404\b/.test(msg) || /not found/i.test(msg) || /redirect off allowlist/i.test(msg)) return "retire";
  return "error";
}

export async function probeAdapter(
  adapter: JobSourceAdapter,
  ctx: SourceContext,
): Promise<ProbeResult> {
  try {
    let jobCount = 0;
    let sampleTitle: string | undefined;
    for await (const stub of adapter.listJobs(ctx, { boardToken: ctx.boardToken, maxPages: 1 })) {
      jobCount += 1;
      if (!sampleTitle) {
        try {
          sampleTitle = adapter.normalize(stub).title;
        } catch {
          sampleTitle = stub.sourceJobId;
        }
      }
    }
    if (jobCount === 0) return { status: "empty", jobCount };
    return { status: "ok", jobCount, sampleTitle };
  } catch (err) {
    return { status: classifyError(err), jobCount: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
