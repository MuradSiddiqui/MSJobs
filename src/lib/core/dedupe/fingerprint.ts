import { contentFingerprint, normalizeCompany, normalizeTitle, fold } from "../normalize/text";

export type DedupeCandidate = {
  id: string;
  source: string;
  sourceJobId: string;
  canonicalUrl: string;
  company: string;
  title: string;
  city: string | null;
};

export function fingerprintOf(job: {
  companyName: string;
  title: string;
  city: string | null;
}): string {
  return contentFingerprint({
    company: job.companyName,
    title: job.title,
    city: job.city,
  });
}

export function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(fold(a));
  const tb = trigrams(fold(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap += 1;
  return overlap / (ta.size + tb.size - overlap);
}

function trigrams(value: string): Set<string> {
  const padded = `  ${value} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

export function isLikelyDuplicate(a: DedupeCandidate, b: DedupeCandidate): boolean {
  if (a.source === b.source && a.sourceJobId === b.sourceJobId) return true;
  if (a.canonicalUrl && a.canonicalUrl === b.canonicalUrl) return true;
  if (fingerprintOf({ companyName: a.company, title: a.title, city: a.city }) ===
    fingerprintOf({ companyName: b.company, title: b.title, city: b.city })) {
    return true;
  }
  if (normalizeCompany(a.company) !== normalizeCompany(b.company)) return false;
  const titleScore = trigramSimilarity(normalizeTitle(a.title), normalizeTitle(b.title));
  const sameCity = !a.city || !b.city || fold(a.city) === fold(b.city);
  return titleScore >= 0.72 && sameCity;
}
