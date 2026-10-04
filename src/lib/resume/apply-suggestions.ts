import type { ResumeParseResult } from "@/lib/core/schemas/ai";

export type CvRewrite = {
  original?: string;
  suggested?: string;
  reason?: string;
};

export type CvSuggestionsPayload = {
  keywordsToInclude?: string[];
  experienceToEmphasize?: string[];
  rewrites?: CvRewrite[];
  missingRequirements?: string[];
  irrelevantSections?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function applyRewritesToString(value: string, rewrites: CvRewrite[]): string {
  let next = value;
  for (const rewrite of rewrites) {
    const original = rewrite.original?.trim();
    const suggested = rewrite.suggested?.trim();
    if (!original || !suggested) continue;
    if (next === original) {
      next = suggested;
      continue;
    }
    if (next.includes(original)) {
      next = next.split(original).join(suggested);
    }
  }
  return next;
}

function walkApply(value: unknown, rewrites: CvRewrite[]): unknown {
  if (typeof value === "string") return applyRewritesToString(value, rewrites);
  if (Array.isArray(value)) return value.map((item) => walkApply(item, rewrites));
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = walkApply(child, rewrites);
    }
    return out;
  }
  return value;
}

function uniqStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

/**
 * Builds a tailored resume JSON from the master CV + AI suggestions.
 * Never mutates the input; the uploaded master CV stays unchanged.
 */
export function applySuggestionsToResume(
  resume: ResumeParseResult,
  suggestions: CvSuggestionsPayload,
): ResumeParseResult {
  const rewrites = suggestions.rewrites ?? [];
  const cloned = structuredClone(resume);
  const tailored = walkApply(cloned, rewrites) as ResumeParseResult;

  const keywords = (suggestions.keywordsToInclude ?? []).map((k) => k.trim()).filter(Boolean);
  if (keywords.length) {
    tailored.skills = uniqStrings([...(tailored.skills ?? []), ...keywords]);
  }

  return tailored;
}
