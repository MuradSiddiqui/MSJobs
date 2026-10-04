import type { EmploymentCategory, RemoteType, Seniority } from "../types";
import { fold } from "../normalize/text";

const HIWI_PATTERNS = [
  /\bhiwi\b/,
  /\bshk\b/,
  /\bwhk\b/,
  /studentische hilfskraft/,
  /wissenschaftliche hilfskraft/,
  /student assistant/,
  /research assistant/,
  /hilfstätigkeit/,
  /hilfstaetigkeit/,
];

const WORKING_STUDENT_PATTERNS = [
  /werkstudent/,
  /working student/,
  /workingstudent/,
];

const INTERNSHIP_PATTERNS = [
  /\bpraktikum\b/,
  /\bintern(ship)?\b/,
  /\btrainee\b/,
  /\bpraktikant/,
];

const THESIS_PATTERNS = [
  /abschlussarbeit/,
  /bachelorarbeit/,
  /masterarbeit/,
  /\bthesis\b/,
  /studienarbeit/,
];

const FULL_TIME_PATTERNS = [
  /vollzeit/,
  /full[ -]?time/,
  /fulltime/,
  /festanstellung/,
  /\bpermanent\b/,
  /unbefristet/,
];

const PART_TIME_PATTERNS = [/\bteilzeit\b/, /part[ -]?time/, /parttime/];
const CONTRACT_PATTERNS = [/\bfreelance\b/, /\bcontractor\b/, /\bfreizuberufl/, /werkvertrag/];

export function classifyEmployment(
  title: string,
  description: string,
  rawType: string | null,
): EmploymentCategory {
  const blob = fold([title, rawType ?? "", description.slice(0, 4000)].join(" "));

  // WHK is HiWi; Wissenschaftlicher Mitarbeiter is usually full-time academic staff.
  const studentAcademic = /wissenschaftliche hilfskraft/.test(blob);
  const staffAcademic = /wissenschaftlicher mitarbeiter/.test(blob) && !studentAcademic;

  if (THESIS_PATTERNS.some((p) => p.test(blob))) return "thesis";
  if (WORKING_STUDENT_PATTERNS.some((p) => p.test(blob))) return "working_student";
  if (HIWI_PATTERNS.some((p) => p.test(blob))) return "hiwi";
  if (INTERNSHIP_PATTERNS.some((p) => p.test(blob))) return "internship";
  if (staffAcademic) return "full_time";
  if (CONTRACT_PATTERNS.some((p) => p.test(blob))) return "contract";
  if (PART_TIME_PATTERNS.some((p) => p.test(blob)) && !FULL_TIME_PATTERNS.some((p) => p.test(blob))) {
    return "part_time";
  }
  if (FULL_TIME_PATTERNS.some((p) => p.test(blob))) return "full_time";
  return "unknown";
}

export function classifyRemote(title: string, description: string, flags?: {
  remote?: boolean | null;
  hybrid?: boolean | null;
  onsite?: boolean | null;
  workplaceType?: string | null;
}): RemoteType {
  if (flags?.hybrid) return "hybrid";
  if (flags?.remote && !flags?.onsite) return "remote";
  if (flags?.onsite && !flags?.remote) return "onsite";

  const workplace = fold(flags?.workplaceType ?? "");
  if (workplace.includes("hybrid")) return "hybrid";
  if (workplace.includes("remote") || workplace.includes("telecommut")) return "remote";
  if (workplace.includes("onsite") || workplace.includes("on-site") || workplace.includes("office")) {
    return "onsite";
  }

  const blob = fold([title, description.slice(0, 3000)].join(" "));
  if (/\bhybrid\b/.test(blob)) return "hybrid";
  if (/\b(remote|homeoffice|home office|fully remote|100% remote)\b/.test(blob)) return "remote";
  if (/\b(onsite|on-site|vor ort|büro|buero)\b/.test(blob)) return "onsite";
  return "unknown";
}

export function classifySeniority(title: string, description: string): Seniority {
  const blob = fold([title, description.slice(0, 2000)].join(" "));
  if (/\b(werkstudent|working student|intern|praktikum|hiwi|student)\b/.test(blob)) return "intern";
  if (/\b(principal|staff|lead|head of|engineering manager|direktor|director)\b/.test(blob)) {
    return "lead";
  }
  if (/\b(senior|sr\.|sen\.)\b/.test(blob)) return "senior";
  if (/\b(junior|jr\.|entry|berufseinstieg|graduate)\b/.test(blob)) return "junior";
  if (/\b(mid[ -]?level|professional|berufserfahren)\b/.test(blob)) return "mid";
  return "unknown";
}

export function extractExperienceYears(text: string): number | null {
  const folded = fold(text);
  const patterns = [
    /(\d+)\+?\s*(?:years?|jahre?)\s*(?:of\s*)?(?:experience|berufserfahrung)/,
    /(?:mindestens|minimum|at least)\s*(\d+)\s*(?:years?|jahre?)/,
    /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|jahre?)/,
  ];
  for (const pattern of patterns) {
    const match = folded.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }
  return null;
}

export function studentEnrollmentRequired(text: string): boolean {
  const folded = fold(text);
  return (
    /immatrikuliert/.test(folded) ||
    /enrolled (in|at) (a |an )?(university|hochschule|college)/.test(folded) ||
    /studierend/.test(folded) && /voraussetzung/.test(folded)
  );
}
