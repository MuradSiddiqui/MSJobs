import { isGermanCountry, parseLocation } from "@/lib/core/normalize/location";
import { unescapeEntitiesTwice } from "@/lib/sources/html";
import { fetchJson } from "@/lib/sources/http";
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

function isGermanJob(job: Record<string, unknown>): boolean {
  for (const office of asArray(job.offices)) {
    const rec = asRecord(office);
    if (!rec) continue;
    if (isGermanCountry(asString(rec.location))) return true;
    if (parseLocation(asString(rec.name)).looksGerman) return true;
  }
  const loc = asRecord(job.location);
  return parseLocation(loc ? asString(loc.name) : null).looksGerman;
}

export const greenhouseAdapter: JobSourceAdapter = {
  name: "greenhouse",
  kind: "ats_board",
  requiresBoardToken: true,

  async *listJobs(ctx: SourceContext, opts: JobFetchOptions) {
    const token = requireBoardToken(ctx, "greenhouse");
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`;
    const { json, status } = await fetchJson<unknown>(url);
    if (status >= 400) throw new Error(`Greenhouse HTTP ${status} for ${token}`);
    for (const item of asArray(asRecord(json)?.jobs)) {
      const rec = asRecord(item);
      if (!rec) continue;
      const id = asString(rec.id);
      if (!id || !isGermanJob(rec)) continue;
      const postedAt = parseTimestamp(rec.first_published);
      if (!freshEnough(postedAt, opts.since)) continue;
      yield {
        source: "greenhouse",
        sourceJobId: id,
        boardToken: token,
        payload: attachCompany(rec, ctx),
        listedAt: postedAt?.toISOString() ?? null,
      } satisfies RawJobStub;
    }
  },

  normalize(stub: RawJobStub) {
    const rec = asRecord(stub.payload) ?? {};
    const loc = asRecord(rec.location);
    const url = asString(rec.absolute_url) ?? "";
    return finishNormalized({
      source: "greenhouse",
      sourceJobId: stub.sourceJobId,
      sourceUrl: url,
      applyUrl: url,
      companyName: asString(rec.__companyName) ?? asString(rec.company_name) ?? stub.boardToken ?? "Unknown",
      title: asString(rec.title) ?? "Untitled",
      descriptionHtml: unescapeEntitiesTwice(asString(rec.content) ?? ""),
      locationRaw: loc ? asString(loc.name) : null,
      postedAt: parseTimestamp(rec.first_published),
      postedAtIsEstimated: false,
      rawPayload: stub.payload,
    });
  },
};
