import { fold } from "../normalize/text";

const STOP = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "this", "that",
  "und", "der", "die", "das", "ein", "eine", "mit", "von", "für", "fur", "sie",
  "wir", "ist", "im", "in", "to", "of", "a", "an", "or", "as", "on", "at",
]);

function tokens(text: string): string[] {
  return fold(text)
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function bag(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens(text)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

export function lexicalSimilarity(a: string, b: string): number {
  const ba = bag(a);
  const bb = bag(b);
  if (ba.size === 0 || bb.size === 0) return 0.3;
  const vocab = new Set([...ba.keys(), ...bb.keys()]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const term of vocab) {
    const idf = 1;
    const va = (ba.get(term) ?? 0) * idf;
    const vb = (bb.get(term) ?? 0) * idf;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type SemanticSimilarityProvider = {
  readonly kind: "lexical" | "embedding";
  similarity(a: string, b: string): Promise<number>;
};

export const lexicalProvider: SemanticSimilarityProvider = {
  kind: "lexical",
  async similarity(a, b) {
    return lexicalSimilarity(a, b);
  },
};
