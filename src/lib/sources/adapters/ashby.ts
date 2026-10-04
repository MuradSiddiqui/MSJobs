import { isGermanCountry, parseLocation } from "@/lib/core/normalize/location";
import { fetchJson } from "@/lib/sources/http";
import { finishNormalized } from "@/lib/sources/normalize-job";
import {
  asArray,
  asBoolean,
  asNumber,
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

function postalBits(value: unknown): string[] {
  const rec = asRecord(value);
  const postal = rec ? (asRecord(rec.postalAddress) ?? rec) : null;
  if (!postal) return typeof value === "string" ? [value] : [];
  return ["addressCountry", "addressLocality", "addressRegion", "addressLine1"]
    .map((key) => asString(postal[key]))
    .filter((v): v is string => Boolean(v));
}

function locationBlobs(job: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (typeof job.location === "string") out.push(job.location);
  else out.push(...postalBits(job.location));
  for (const extra of asArray(job.secondaryLocations)) {
    const rec = asRecord(extra);
    if (!rec) continue;
    if (typeof rec.location === "string") out.push(rec.location);
    out.push(...postalBits(rec.address ?? rec));
  }
  return out;
}

function keepAshby(job: Record<string, unknown>): boolean {
  const parts = locationBlobs(job);
  const blob = parts.join(" ");
  if (parts.some((part) => isGermanCountry(part) || parseLocation(part).looksGerman)) return true;
  const remote = job.isRemote === true;
  return remote && /\b(eu|europe|eea|germany|deutschland|european)\b/i.test(blob);
}

function salary(job: Record<string, unknown>) {
  const comp = asRecord(job.compensation);
  const summary = comp ? asString(comp.scrapeableCompensationSalarySummary) : null;
  if (!summary) return { min: null as number | null, max: null as number | null, currency: null as string | null };
  const nums = [...summary.matchAll(/(\d[\d,]*)/g)].map((m) => Number(m[1]?.replace(/,/g, "")));
  const currency = summary.match(/\b([A-Z]{3})\b/)?.[1] ?? null;
  return { min: nums[0] ?? null, max: nums[1] ?? nums[0] ?? null, currency };
}

export const ashbyAdapter: JobSourceAdapter = {
  name: "ashby",
  kind: "ats_board",
  requiresBoardToken: true,

  async *listJobs(ctx: SourceContext, opts: JobFetchOptions) {
    const token = requireBoardToken(ctx, "ashby");
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}?includeCompensation=true`;
    const { json, status } = await fetchJson<unknown>(url);
    if (status >= 400) throw new Error(`Ashby HTTP ${status} for ${token}`);
    for (const item of asArray(asRecord(json)?.jobs)) {
      const rec = asRecord(item);
      if (!rec || rec.isListed === false || !keepAshby(rec)) continue;
      const id = asString(rec.id);
      if (!id) continue;
      const postedAt = parseTimestamp(rec.publishedAt);
      if (!freshEnough(postedAt, opts.since)) continue;
      yield {
        source: "ashby",
        sourceJobId: id,
        boardToken: token,
        payload: attachCompany(rec, ctx),
        listedAt: postedAt?.toISOString() ?? null,
      } satisfies RawJobStub;
    }
  },

  normalize(stub: RawJobStub) {
    const rec = asRecord(stub.payload) ?? {};
    const pay = salary(rec);
    const loc = locationBlobs(rec).join(", ");
    const apply = asString(rec.applyUrl) ?? asString(rec.jobUrl) ?? "";
    return finishNormalized({
      source: "ashby",
      sourceJobId: stub.sourceJobId,
      sourceUrl: asString(rec.jobUrl) ?? apply,
      applyUrl: apply,
      companyName: asString(rec.__companyName) ?? stub.boardToken ?? "Unknown",
      title: asString(rec.title) ?? "Untitled",
      descriptionHtml: asString(rec.descriptionHtml),
      descriptionText: asString(rec.descriptionPlain),
      locationRaw: loc || null,
      remoteHint: asBoolean(rec.isRemote),
      workplace: asString(rec.workplaceType),
      employmentTypeRaw: asString(rec.employmentType),
      salaryMin: pay.min ?? asNumber(rec.salaryMin),
      salaryMax: pay.max ?? asNumber(rec.salaryMax),
      salaryCurrency: pay.currency,
      postedAt: parseTimestamp(rec.publishedAt),
      postedAtIsEstimated: false,
      rawPayload: stub.payload,
    });
  },
};
