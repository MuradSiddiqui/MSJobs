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

function sectionHtml(detail: Record<string, unknown>): string {
  const sections = asRecord(asRecord(detail.jobAd)?.sections);
  if (!sections) return "";
  return ["jobDescription", "qualifications", "additionalInformation", "companyDescription"]
    .map((key) => asString(asRecord(sections[key])?.text))
    .filter((v): v is string => Boolean(v))
    .join("\n");
}

function locationRaw(rec: Record<string, unknown>): string | null {
  const loc = asRecord(rec.location);
  if (!loc) return null;
  return [asString(loc.city), asString(loc.region), asString(loc.country), asString(loc.fullLocation)]
    .filter((v): v is string => Boolean(v))
    .join(", ");
}

export const smartrecruitersAdapter: JobSourceAdapter = {
  name: "smartrecruiters",
  kind: "ats_board",
  requiresBoardToken: true,

  async *listJobs(ctx: SourceContext, opts: JobFetchOptions) {
    const token = requireBoardToken(ctx, "smartrecruiters");
    const limit = 100;
    const maxPages = opts.maxPages ?? 50;
    for (let page = 0; page < maxPages; page += 1) {
      const offset = page * limit;
      const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(token)}/postings?country=de&limit=${limit}&offset=${offset}`;
      const { json, status } = await fetchJson<unknown>(url);
      if (status >= 400) throw new Error(`SmartRecruiters HTTP ${status} for ${token}`);
      const root = asRecord(json) ?? {};
      const rows = asArray(root.content);
      if (rows.length === 0) break;
      for (const item of rows) {
        const rec = asRecord(item);
        const id = rec ? asString(rec.id) : null;
        if (!rec || !id) continue;
        const postedAt = parseTimestamp(rec.releasedDate);
        if (!freshEnough(postedAt, opts.since)) continue;
        yield {
          source: "smartrecruiters",
          sourceJobId: id,
          boardToken: token,
          payload: attachCompany(rec, ctx),
          listedAt: postedAt?.toISOString() ?? null,
        } satisfies RawJobStub;
      }
      const total = asNumber(root.totalFound) ?? 0;
      if (offset + rows.length >= total) break;
    }
  },

  async hydrate(ctx: SourceContext, stub: RawJobStub) {
    const token = requireBoardToken(ctx, "smartrecruiters");
    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(token)}/postings/${encodeURIComponent(stub.sourceJobId)}`;
    const { json, status } = await fetchJson<unknown>(url);
    if (status >= 400) return stub;
    return { ...stub, payload: { list: stub.payload, detail: json } };
  },

  normalize(stub: RawJobStub) {
    const wrapped = asRecord(stub.payload) ?? {};
    const detail = asRecord(wrapped.detail);
    const list = asRecord(wrapped.list) ?? (detail ? {} : wrapped);
    const rec = { ...list, ...detail };
    const loc = asRecord(rec.location);
    const emp = asRecord(rec.typeOfEmployment);
    const company = asRecord(rec.company);
    const apply = asString(rec.applyUrl) ?? asString(rec.postingUrl) ?? null;
    return finishNormalized({
      source: "smartrecruiters",
      sourceJobId: stub.sourceJobId,
      sourceUrl: apply ?? `https://jobs.smartrecruiters.com/${stub.boardToken ?? ""}/${stub.sourceJobId}`,
      applyUrl: apply,
      companyName: asString(rec.__companyName) ?? asString(company?.name) ?? stub.boardToken ?? "Unknown",
      title: asString(rec.name) ?? asString(rec.title) ?? "Untitled",
      descriptionHtml: detail ? sectionHtml(detail) : "",
      locationRaw: locationRaw(rec),
      remoteHint: loc ? asBoolean(loc.remote) : null,
      hybridHint: loc ? asBoolean(loc.hybrid) : null,
      employmentTypeRaw: emp ? asString(emp.label) ?? asString(emp.id) : null,
      postedAt: parseTimestamp(rec.releasedDate),
      postedAtIsEstimated: false,
      rawPayload: stub.payload,
    });
  },
};
