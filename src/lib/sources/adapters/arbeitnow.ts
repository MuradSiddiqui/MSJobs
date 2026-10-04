import { GERMAN_CITIES, parseLocation } from "@/lib/core/normalize/location";
import { fold } from "@/lib/core/normalize/text";
import { fetchJson } from "@/lib/sources/http";
import { finishNormalized } from "@/lib/sources/normalize-job";
import {
  asArray,
  asBoolean,
  asRecord,
  asString,
  freshEnough,
  parseTimestamp,
  type JobFetchOptions,
  type JobSourceAdapter,
  type RawJobStub,
  type SourceContext,
} from "@/lib/sources/types";

const CITY_KEYS = new Set(GERMAN_CITIES.flatMap((city) => [fold(city.name), ...city.aliases.map(fold)]));

function isGermanListing(location: string | null): boolean {
  const parsed = parseLocation(location);
  if (parsed.looksGerman) return true;
  if (!location) return false;
  const folded = fold(location);
  return CITY_KEYS.has(folded) || [...CITY_KEYS].some((city) => folded.includes(city));
}

export const arbeitnowAdapter: JobSourceAdapter = {
  name: "arbeitnow",
  kind: "aggregator",
  requiresBoardToken: false,

  async *listJobs(_ctx: SourceContext, opts: JobFetchOptions) {
    const maxPages = opts.maxPages ?? 8;
    for (let page = 1; page <= maxPages; page += 1) {
      const { json, status } = await fetchJson<unknown>(
        `https://www.arbeitnow.com/api/job-board-api?page=${page}`,
      );
      if (status >= 400) throw new Error(`Arbeitnow HTTP ${status}`);
      const jobs = asArray(asRecord(json)?.data);
      if (jobs.length === 0) break;
      for (const item of jobs) {
        const rec = asRecord(item);
        if (!rec) continue;
        const slug = asString(rec.slug);
        const location = asString(rec.location);
        if (!slug || !isGermanListing(location)) continue;
        const postedAt = parseTimestamp(rec.created_at);
        if (!freshEnough(postedAt, opts.since)) continue;
        yield {
          source: "arbeitnow",
          sourceJobId: slug,
          payload: rec,
          listedAt: postedAt?.toISOString() ?? null,
        } satisfies RawJobStub;
      }
    }
  },

  normalize(stub: RawJobStub) {
    const rec = asRecord(stub.payload) ?? {};
    const types = asArray(rec.job_types).map(asString).filter((v): v is string => Boolean(v));
    const url = asString(rec.url) ?? `https://www.arbeitnow.com/jobs/${stub.sourceJobId}`;
    return finishNormalized({
      source: "arbeitnow",
      sourceJobId: stub.sourceJobId,
      sourceUrl: url,
      applyUrl: url,
      companyName: asString(rec.company_name) ?? "Unknown",
      title: asString(rec.title) ?? "Untitled",
      descriptionHtml: asString(rec.description),
      locationRaw: asString(rec.location),
      remoteHint: asBoolean(rec.remote),
      employmentTypeRaw: types.join(", ") || null,
      postedAt: parseTimestamp(rec.created_at),
      postedAtIsEstimated: true,
      rawPayload: stub.payload,
    });
  },
};
