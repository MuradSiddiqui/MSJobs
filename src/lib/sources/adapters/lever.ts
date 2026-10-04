import { fetchText } from "@/lib/sources/http";
import { finishNormalized } from "@/lib/sources/normalize-job";
import {
  asArray,
  asRecord,
  asString,
  attachCompany,
  freshEnough,
  parseTimestamp,
  requireBoardToken,
  type JobFetchOptions,
  type JobSourceAdapter,
  type RawJobStub,
  type SourceContext,
} from "@/lib/sources/types";

async function loadPostings(token: string): Promise<unknown> {
  const hosts = ["api.lever.co", "api.eu.lever.co"] as const;
  let lastError: Error | null = null;
  for (const host of hosts) {
    const url = `https://${host}/v0/postings/${encodeURIComponent(token)}?mode=json`;
    try {
      let res = await fetchText(url, { headers: { Accept: "application/json" } });
      let type = (res.headers.get("content-type") ?? "").toLowerCase();
      if (type.includes("text/html")) {
        res = await fetchText(url, { headers: { Accept: "application/json" } });
        type = (res.headers.get("content-type") ?? "").toLowerCase();
      }
      if (type.includes("text/html")) {
        lastError = new Error(`Lever returned HTML from ${host}`);
        continue;
      }
      if (res.status === 404) {
        lastError = new Error(`Lever 404 from ${host}`);
        continue;
      }
      if (res.status >= 400) throw new Error(`Lever HTTP ${res.status} from ${host}`);
      return JSON.parse(res.text) as unknown;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error("Lever fetch failed");
}

export const leverAdapter: JobSourceAdapter = {
  name: "lever",
  kind: "ats_board",
  requiresBoardToken: true,

  async *listJobs(ctx: SourceContext, opts: JobFetchOptions) {
    const token = requireBoardToken(ctx, "lever");
    const payload = await loadPostings(token);
    for (const item of asArray(payload)) {
      const rec = asRecord(item);
      const id = rec ? asString(rec.id) : null;
      if (!rec || !id || asString(rec.country) !== "DE") continue;
      const postedAt = parseTimestamp(rec.createdAt);
      if (!freshEnough(postedAt, opts.since)) continue;
      yield {
        source: "lever",
        sourceJobId: id,
        boardToken: token,
        payload: attachCompany(rec, ctx),
        listedAt: postedAt?.toISOString() ?? null,
      } satisfies RawJobStub;
    }
  },

  normalize(stub: RawJobStub) {
    const rec = asRecord(stub.payload) ?? {};
    const cats = asRecord(rec.categories);
    const apply = asString(rec.applyUrl) ?? asString(rec.hostedUrl) ?? "";
    return finishNormalized({
      source: "lever",
      sourceJobId: stub.sourceJobId,
      sourceUrl: asString(rec.hostedUrl) ?? apply,
      applyUrl: apply,
      companyName: asString(rec.__companyName) ?? stub.boardToken ?? "Unknown",
      title: asString(rec.text) ?? asString(rec.title) ?? "Untitled",
      descriptionHtml: asString(rec.description),
      descriptionText: asString(rec.descriptionPlain),
      locationRaw: cats ? asString(cats.location) ?? asString(cats.allLocations) : asString(rec.country),
      workplace: asString(rec.workplaceType),
      employmentTypeRaw: cats ? asString(cats.commitment) : null,
      postedAt: parseTimestamp(rec.createdAt),
      postedAtIsEstimated: false,
      rawPayload: stub.payload,
    });
  },
};
