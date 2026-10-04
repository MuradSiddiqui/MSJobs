import { isGermanCountry, parseLocation } from "@/lib/core/normalize/location";
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

function countryOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  const rec = asRecord(value);
  return rec ? asString(rec.name) ?? asString(rec["@id"]) : null;
}

function isGermanPosting(job: Record<string, unknown>): boolean {
  for (const loc of asArray(job.jobLocation)) {
    const rec = asRecord(loc);
    const address = rec ? (asRecord(rec.address) ?? rec) : null;
    const country = address ? countryOf(address.addressCountry) : countryOf(loc);
    const locality = address ? asString(address.addressLocality) : null;
    if (isGermanCountry(country) || parseLocation([locality, country].filter(Boolean).join(", ")).looksGerman) {
      return true;
    }
  }
  for (const req of asArray(job.applicantLocationRequirements)) {
    const rec = asRecord(req);
    const name = rec ? asString(rec.name) : asString(req);
    if (isGermanCountry(name) || parseLocation(name).looksGerman) return true;
  }
  return false;
}

function locationRaw(job: Record<string, unknown>): string | null {
  const parts: string[] = [];
  for (const loc of asArray(job.jobLocation)) {
    const rec = asRecord(loc);
    const address = rec ? (asRecord(rec.address) ?? rec) : null;
    if (!address) continue;
    for (const key of ["addressLocality", "addressRegion", "addressCountry"]) {
      const v = countryOf(address[key]) ?? asString(address[key]);
      if (v) parts.push(v);
    }
  }
  return parts.length ? parts.join(", ") : null;
}

export const teamtailorAdapter: JobSourceAdapter = {
  name: "teamtailor",
  kind: "ats_board",
  requiresBoardToken: true,

  async *listJobs(ctx: SourceContext, opts: JobFetchOptions) {
    const token = requireBoardToken(ctx, "teamtailor");
    const url = `https://${token}.teamtailor.com/jobs.json`;
    const { json, status } = await fetchJson<unknown>(url);
    if (status >= 400) throw new Error(`Teamtailor HTTP ${status} for ${token}`);
    for (const item of asArray(asRecord(json)?.items)) {
      const rec = asRecord(item);
      if (!rec) continue;
      const posting = asRecord(rec._jobposting) ?? rec;
      if (!isGermanPosting(posting)) continue;
      const id = asString(rec.id) ?? asString(posting.identifier) ?? asString(posting.url);
      if (!id) continue;
      const postedAt = parseTimestamp(rec.date_published ?? posting.datePosted);
      if (!freshEnough(postedAt, opts.since)) continue;
      yield {
        source: "teamtailor",
        sourceJobId: id,
        boardToken: token,
        payload: attachCompany({ item: rec, posting }, ctx),
        listedAt: postedAt?.toISOString() ?? null,
      } satisfies RawJobStub;
    }
  },

  normalize(stub: RawJobStub) {
    const wrap = asRecord(stub.payload) ?? {};
    const item = asRecord(wrap.item) ?? wrap;
    const posting = asRecord(wrap.posting) ?? asRecord(item._jobposting) ?? item;
    const org = asRecord(posting.hiringOrganization);
    const url = asString(item.url) ?? asString(posting.url) ?? "";
    return finishNormalized({
      source: "teamtailor",
      sourceJobId: stub.sourceJobId,
      sourceUrl: url,
      applyUrl: url,
      companyName: asString(wrap.__companyName) ?? asString(org?.name) ?? stub.boardToken ?? "Unknown",
      companyLogo: org ? asString(org.logo) : null,
      companyWebsite: org ? asString(org.sameAs) ?? asString(org.url) : null,
      title: asString(posting.title) ?? asString(item.title) ?? "Untitled",
      descriptionHtml: asString(posting.description) ?? asString(item.content_html),
      locationRaw: locationRaw(posting),
      workplace: asString(posting.jobLocationType),
      employmentTypeRaw: asString(posting.employmentType),
      postedAt: parseTimestamp(item.date_published ?? posting.datePosted),
      postedAtIsEstimated: false,
      rawPayload: stub.payload,
    });
  },
};
