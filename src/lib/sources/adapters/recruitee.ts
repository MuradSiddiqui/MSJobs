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

function locIsDe(rec: Record<string, unknown>): boolean {
  if (isGermanCountry(asString(rec.country_code) ?? asString(rec.country))) return true;
  return parseLocation(
    [asString(rec.city), asString(rec.location), asString(rec.country)].filter((v): v is string => Boolean(v)).join(", "),
  ).looksGerman;
}

function isGermanOffer(offer: Record<string, unknown>): boolean {
  if (locIsDe(offer)) return true;
  return asArray(offer.locations).some((loc) => {
    const rec = asRecord(loc);
    return rec ? locIsDe(rec) : false;
  });
}

export const recruiteeAdapter: JobSourceAdapter = {
  name: "recruitee",
  kind: "ats_board",
  requiresBoardToken: true,

  async *listJobs(ctx: SourceContext, opts: JobFetchOptions) {
    const token = requireBoardToken(ctx, "recruitee");
    const url = `https://${token}.recruitee.com/api/offers/`;
    const { json, status } = await fetchJson<unknown>(url);
    if (status >= 400) throw new Error(`Recruitee HTTP ${status} for ${token}`);
    for (const item of asArray(asRecord(json)?.offers)) {
      const rec = asRecord(item);
      const id = rec ? asString(rec.id) : null;
      if (!rec || !id || !isGermanOffer(rec)) continue;
      const postedAt = parseTimestamp(rec.published_at ?? rec.created_at);
      if (!freshEnough(postedAt, opts.since)) continue;
      yield {
        source: "recruitee",
        sourceJobId: id,
        boardToken: token,
        payload: attachCompany(rec, ctx),
        listedAt: postedAt?.toISOString() ?? null,
      } satisfies RawJobStub;
    }
  },

  normalize(stub: RawJobStub) {
    const rec = asRecord(stub.payload) ?? {};
    const salary = asRecord(rec.salary);
    const html = [asString(rec.description), asString(rec.requirements)].filter(Boolean).join("\n");
    const apply = asString(rec.careers_apply_url) ?? asString(rec.careers_url) ?? "";
    return finishNormalized({
      source: "recruitee",
      sourceJobId: stub.sourceJobId,
      sourceUrl: asString(rec.careers_url) ?? apply,
      applyUrl: apply,
      companyName: asString(rec.__companyName) ?? asString(rec.company_name) ?? stub.boardToken ?? "Unknown",
      title: asString(rec.title) ?? "Untitled",
      descriptionHtml: html,
      locationRaw: [asString(rec.city), asString(rec.country), asString(rec.location)]
        .filter((v): v is string => Boolean(v))
        .join(", "),
      remoteHint: asBoolean(rec.remote),
      hybridHint: asBoolean(rec.hybrid),
      onsiteHint: asBoolean(rec.on_site),
      employmentTypeRaw: asString(rec.employment_type_code),
      salaryMin: salary ? asNumber(salary.min) : null,
      salaryMax: salary ? asNumber(salary.max) : null,
      salaryCurrency: salary ? asString(salary.currency) : null,
      minWeeklyHours: asNumber(rec.min_hours),
      maxWeeklyHours: asNumber(rec.max_hours),
      postedAt: parseTimestamp(rec.published_at ?? rec.created_at),
      postedAtIsEstimated: false,
      rawPayload: stub.payload,
    });
  },
};
