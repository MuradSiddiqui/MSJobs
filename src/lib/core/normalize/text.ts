export function fold(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ß/g, "ss");
}

export function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeCompany(name: string): string {
  return compactWhitespace(
    fold(name)
      .replace(/\b(gmbh|ag|kg|ug|se|inc|llc|ltd|co kg|mbh|& co)\b\.?/g, "")
      .replace(/[.,/#'"()+]/g, " "),
  );
}

export function normalizeTitle(title: string): string {
  return compactWhitespace(
    fold(title)
      .replace(/\(m\/w\/d\)|\(w\/m\/d\)|\(f\/m\/d\)|\(d\/m\/w\)|\bm\/w\/d\b/g, "")
      .replace(/\(all genders\)|\(all genders\/all genders\)/g, "")
      .replace(/[|/·•]/g, " ")
      .replace(/[^a-z0-9+#.\s-]/g, " "),
  );
}

export function stripTrackingParams(url: string): string {
  try {
    const parsed = new URL(url);
    const drop = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gh_src",
      "gh_jid",
      "lever-source",
      "ref",
      "source",
    ];
    for (const key of drop) parsed.searchParams.delete(key);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

export function sha256Hex(input: string): string {
  // Pure JS fallback used by core (no Node crypto import, keeps core portable).
  // Ingestion and the web app re-hash with Node crypto when available.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function contentFingerprint(input: {
  company: string;
  title: string;
  city: string | null;
}): string {
  return [
    normalizeCompany(input.company),
    normalizeTitle(input.title),
    fold(input.city ?? ""),
  ].join("|");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function uniqueNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = fold(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}
