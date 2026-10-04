import { fetchJson } from "@/lib/sources/http";
import { finishNormalized } from "@/lib/sources/normalize-job";
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  freshEnough,
  parseTimestamp,
  type JobFetchOptions,
  type JobSourceAdapter,
  type RawJobStub,
  type SourceContext,
} from "@/lib/sources/types";

const API_KEY = "jobboerse-jobsuche";
const LIST_URL = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v6/jobs";
const DETAIL_URL = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobdetails";

function baHeaders(): Record<string, string> {
  return { "X-API-Key": API_KEY, Accept: "application/json" };
}

function listRecord(payload: unknown): Record<string, unknown> {
  const wrap = asRecord(payload) ?? {};
  return asRecord(wrap.list) ?? (asRecord(wrap.detail) ? {} : wrap);
}

function detailRecord(payload: unknown): Record<string, unknown> | null {
  const wrap = asRecord(payload) ?? {};
  return asRecord(wrap.detail);
}

function locationRaw(rec: Record<string, unknown>): string | null {
  const ort = asRecord(rec.arbeitsort) ?? asRecord(rec.arbeitsOrt);
  if (ort) {
    return [asString(ort.ort), asString(ort.region), asString(ort.plz), asString(ort.land)]
      .filter((v): v is string => Boolean(v))
      .join(", ");
  }
  return asString(rec.ort);
}

export const bundesagenturAdapter: JobSourceAdapter = {
  name: "bundesagentur",
  kind: "aggregator",
  requiresBoardToken: false,

  async *listJobs(_ctx: SourceContext, opts: JobFetchOptions) {
    const maxPages = opts.maxPages ?? 1;
    const params = new URLSearchParams({ was: "Softwareentwickler", size: "20" });
    if (opts.since) {
      const days = Math.max(0, Math.ceil((Date.now() - opts.since.getTime()) / 86_400_000));
      params.set("veroeffentlichtseit", String(days));
    }
    for (let page = 1; page <= maxPages; page += 1) {
      params.set("page", String(page));
      const { json, status } = await fetchJson<unknown>(`${LIST_URL}?${params.toString()}`, {
        headers: baHeaders(),
      });
      if (status >= 400) throw new Error(`Bundesagentur HTTP ${status}`);
      const rows = asArray(asRecord(json)?.stellenangebote);
      if (rows.length === 0) break;
      for (const item of rows) {
        const rec = asRecord(item);
        const id = rec ? asString(rec.refnr) ?? asString(rec.referenznummer) : null;
        if (!rec || !id) continue;
        const postedAt = parseTimestamp(rec.datumErsteVeroeffentlichung);
        if (!freshEnough(postedAt, opts.since)) continue;
        yield {
          source: "bundesagentur",
          sourceJobId: id,
          payload: rec,
          listedAt: postedAt?.toISOString() ?? null,
        } satisfies RawJobStub;
      }
    }
  },

  async hydrate(_ctx: SourceContext, stub: RawJobStub) {
    const b64 = Buffer.from(stub.sourceJobId, "utf8").toString("base64");
    const url = `${DETAIL_URL}/${encodeURIComponent(b64)}`;
    const { json, status } = await fetchJson<unknown>(url, { headers: baHeaders() });
    if (status >= 400) return stub;
    return { ...stub, payload: { list: stub.payload, detail: json } };
  },

  normalize(stub: RawJobStub) {
    const list = listRecord(stub.payload);
    const detail = detailRecord(stub.payload);
    const rec = { ...list, ...detail };
    const apply = asString(rec.externeUrl) ?? asString(rec.externeURL) ?? null;
    const html =
      asString(rec.stellenbeschreibung) ?? asString(detail?.stellenbeschreibung) ?? asString(rec.beschreibung) ?? "";
    return finishNormalized({
      source: "bundesagentur",
      sourceJobId: stub.sourceJobId,
      sourceUrl: apply ?? `https://www.arbeitsagentur.de/jobsuche/jobdetail/${stub.sourceJobId}`,
      applyUrl: apply,
      companyName: asString(rec.arbeitgeber) ?? asString(rec.firma) ?? "Unknown",
      title: asString(rec.titel) ?? asString(rec.berufsbezeichnung) ?? "Untitled",
      descriptionHtml: html,
      locationRaw: locationRaw(rec),
      salaryMin: asNumber(rec.gehaltsspanneVon),
      salaryMax: asNumber(rec.gehaltsspanneBis),
      salaryCurrency: asNumber(rec.gehaltsspanneVon) != null ? "EUR" : null,
      postedAt: parseTimestamp(rec.datumErsteVeroeffentlichung),
      postedAtIsEstimated: true,
      rawPayload: stub.payload,
    });
  },
};
