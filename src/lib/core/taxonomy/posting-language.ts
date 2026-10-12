/**
 * Detect the language the job *ad* is written in (not "requires English").
 * Heuristic: German function words / umlauts vs English function words.
 */
export type PostingLanguage = "en" | "de" | "unknown";

const DE_MARKERS =
  /\b(und|oder|mit|für|fuer|bei|als|wir|sie|ihr|ihre|unser|unsere|gesucht|bewerben|vollzeit|teilzeit|praktikum|werkstudent|kenntnisse|aufgaben|anforderungen|unternehmen|erfahrung|abschluss|bewerbung)\b|[äöüß]/i;

const EN_MARKERS =
  /\b(and|or|with|for|the|you|your|we|our|are|will|looking|apply|full[- ]time|part[- ]time|internship|requirements|responsibilities|experience|about the role|job description|what you.?ll)\b/i;

export function detectPostingLanguage(title: string, description: string): PostingLanguage {
  const text = `${title}\n${description}`.slice(0, 8_000);
  if (!text.trim()) return "unknown";

  const deHits = countMatches(text, DE_MARKERS);
  const enHits = countMatches(text, EN_MARKERS);

  // Umlauts / ß are a strong German signal even with few keyword hits.
  const hasGermanChars = /[äöüÄÖÜß]/.test(text);

  if (hasGermanChars && deHits >= enHits) return "de";
  if (deHits === 0 && enHits === 0) return hasGermanChars ? "de" : "unknown";
  if (deHits > enHits * 1.15) return "de";
  if (enHits > deHits * 1.15) return "en";
  if (hasGermanChars) return "de";
  if (enHits > 0) return "en";
  return "unknown";
}

function countMatches(text: string, re: RegExp): number {
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  return (text.match(global) ?? []).length;
}
