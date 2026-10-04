import type { LanguageRequirement, VisaSignal } from "../types";
import { fold } from "../normalize/text";

const LANGUAGE_NAMES = [
  ["german", "deutsch", "germany"],
  ["english", "englisch"],
  ["french", "französisch", "franzoesisch"],
  ["spanish", "spanisch"],
] as const;

const LEVELS = ["c2", "c1", "b2", "b1", "a2", "a1", "native", "fluent", "business"];

export function extractLanguageRequirements(text: string): LanguageRequirement[] {
  const folded = fold(text);
  const results: LanguageRequirement[] = [];

  for (const [en] of LANGUAGE_NAMES) {
    const present = LANGUAGE_NAMES.find(([canonical]) => canonical === en);
    if (!present) continue;
    const names = LANGUAGE_NAMES.find((row) => row[0] === en);
    if (!names) continue;
    const hit = names.some((n) => folded.includes(n));
    if (!hit) continue;
    const level = LEVELS.find((lvl) => {
      const idx = folded.indexOf(en);
      const window = folded.slice(Math.max(0, idx - 24), idx + 24);
      return window.includes(lvl);
    });
    const required = /required|must|pflicht|voraussetzung/.test(folded);
    results.push({
      language: en === "german" ? "German" : en === "english" ? "English" : en,
      level: level ?? null,
      required,
    });
  }

  return results;
}

export function detectVisaSignal(text: string): VisaSignal {
  const folded = fold(text);
  if (/visa sponsorship|arbeitserlaubnis|work permit|relocation support/.test(folded)) {
    if (/no visa|without sponsorship|must have (eu|german) (work )?permit/.test(folded)) {
      return "required";
    }
    return "provided";
  }
  if (/eu (citizenship|passport)|work authorization already|berechtigt in deutschland/.test(folded)) {
    return "required";
  }
  return "unknown";
}

export function extractWeeklyHours(text: string): { min: number | null; max: number | null } {
  const folded = fold(text);
  const range = folded.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(?:h|hours|stunden)\b/);
  if (range?.[1] && range[2]) {
    return { min: Number(range[1]), max: Number(range[2]) };
  }
  const single = folded.match(/(\d{1,2})\s*(?:h|hours|stunden)\s*(?:\/|per|pro)\s*(?:week|woche)/);
  if (single?.[1]) {
    const n = Number(single[1]);
    return { min: n, max: n };
  }
  return { min: null, max: null };
}
