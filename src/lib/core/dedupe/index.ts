import { contentFingerprint } from "../normalize/text";
import { fold } from "../normalize/text";

export type DedupeCandidate = {
  source: string;
  sourceJobId: string;
  canonicalUrl: string;
  company: string;
  title: string;
  city: string | null;
};

export type DedupeDecision =
  | { kind: "exact_source_id" }
  | { kind: "canonical_url" }
  | { kind: "fingerprint" }
  | { kind: "fuzzy"; similarity: number }
  | { kind: "unique" };

export function fingerprintOf(job: DedupeCandidate): string {
  return contentFingerprint({
    company: job.company,
    title: job.title,
    city: job.city,
  });
}

export function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(fold(a));
  const tb = trigrams(fold(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const gram of ta) if (tb.has(gram)) overlap += 1;
  return overlap / (ta.size + tb.size - overlap);
}

function trigrams(value: string): Set<string> {
  const padded = `  ${value} `;
  const grams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) grams.add(padded.slice(i, i + 3));
  return grams;
}

export function decideDuplicate(
  incoming: DedupeCandidate,
  existing: DedupeCandidate[],
): { match: DedupeCandidate | null; decision: DedupeDecision } {
  const sourceHit = existing.find(
    (job) => job.source === incoming.source && job.sourceJobId === incoming.sourceJobId,
  );
  if (sourceHit) return { match: sourceHit, decision: { kind: "exact_source_id" } };

  const urlHit = existing.find(
    (job) => job.canonicalUrl && incoming.canonicalUrl && job.canonicalUrl === incoming.canonicalUrl,
  );
  if (urlHit) return { match: urlHit, decision: { kind: "canonical_url" } };

  const incomingFp = fingerprintOf(incoming);
  const fpHit = existing.find((job) => fingerprintOf(job) === incomingFp);
  if (fpHit) return { match: fpHit, decision: { kind: "fingerprint" } };

  let best: { job: DedupeCandidate; similarity: number } | null = null;
  for (const job of existing) {
    if (fold(job.company) !== fold(incoming.company)) continue;
    const similarity = trigramSimilarity(job.title, incoming.title);
    if (similarity >= 0.72 && (!best || similarity > best.similarity)) {
      best = { job, similarity };
    }
  }
  if (best) return { match: best.job, decision: { kind: "fuzzy", similarity: best.similarity } };
  return { match: null, decision: { kind: "unique" } };
}
