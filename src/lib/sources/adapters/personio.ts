import { XMLParser } from "fast-xml-parser";
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

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  isArray: (name) => name === "position" || name === "jobDescription",
});

function xmlText(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return asString(value);
  const rec = asRecord(value);
  if (!rec) return null;
  return xmlText(rec["#text"] ?? rec.__cdata ?? rec.value);
}

async function loadFeed(token: string): Promise<{ xml: string; host: string }> {
  const de = `${token}.jobs.personio.de`;
  const com = `${token}.jobs.personio.com`;
  const headers = { Accept: "application/xml, text/xml, */*" };
  try {
    const res = await fetchText(`https://${de}/xml`, { headers });
    if (res.status >= 400) throw new Error(`Personio .de HTTP ${res.status}`);
    return { xml: res.text, host: de };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Bot protection")) throw err;
    const res = await fetchText(`https://${com}/xml`, { headers });
    if (res.status >= 400) throw new Error(`Personio HTTP ${res.status}`);
    return { xml: res.text, host: com };
  }
}

function descriptions(position: Record<string, unknown>): string {
  const block = asRecord(position.jobDescriptions);
  const items = asArray(block?.jobDescription ?? position.jobDescription);
  return items
    .map((item) => {
      const rec = asRecord(item);
      return rec ? xmlText(rec.value) : xmlText(item);
    })
    .filter((v): v is string => Boolean(v))
    .join("\n");
}

export const personioAdapter: JobSourceAdapter = {
  name: "personio",
  kind: "ats_board",
  requiresBoardToken: true,

  async *listJobs(ctx: SourceContext, opts: JobFetchOptions) {
    const token = requireBoardToken(ctx, "personio");
    const { xml, host } = await loadFeed(token);
    const parsed: unknown = parser.parse(xml);
    const root = asRecord(parsed);
    const jobsNode = asRecord(root?.["workzag-jobs"] ?? root?.workzagJobs);
    const positions = asArray(jobsNode?.position ?? asRecord(parsed)?.position);
    for (const item of positions) {
      const rec = asRecord(item);
      const id = rec ? asString(rec.id) : null;
      if (!rec || !id) continue;
      const postedAt = parseTimestamp(rec.createdAt ?? rec.created_at);
      if (!freshEnough(postedAt, opts.since)) continue;
      yield {
        source: "personio",
        sourceJobId: id,
        boardToken: token,
        payload: attachCompany({ ...rec, __host: host }, ctx),
        listedAt: postedAt?.toISOString() ?? null,
      } satisfies RawJobStub;
    }
  },

  normalize(stub: RawJobStub) {
    const rec = asRecord(stub.payload) ?? {};
    const host = asString(rec.__host) ?? `${stub.boardToken ?? "board"}.jobs.personio.de`;
    const applyUrl = `https://${host}/job/${stub.sourceJobId}`;
    return finishNormalized({
      source: "personio",
      sourceJobId: stub.sourceJobId,
      sourceUrl: applyUrl,
      applyUrl,
      companyName: asString(rec.__companyName) ?? asString(rec.subcompany) ?? stub.boardToken ?? "Unknown",
      title: asString(rec.name) ?? "Untitled",
      descriptionHtml: descriptions(rec),
      locationRaw: asString(rec.office) ?? asString(rec.additionalOffices),
      employmentTypeRaw: asString(rec.employmentType) ?? asString(rec.recruitingCategory),
      workplace: asString(rec.schedule),
      postedAt: parseTimestamp(rec.createdAt ?? rec.created_at),
      postedAtIsEstimated: false,
      rawPayload: stub.payload,
    });
  },
};
