import {
  classifyEmployment,
  classifyRemote,
  classifySeniority,
  extractExperienceYears,
  studentEnrollmentRequired,
} from "@/lib/core/taxonomy/employment";
import { extractSkills } from "@/lib/core/taxonomy/skills";
import {
  detectVisaSignal,
  extractLanguageRequirements,
  extractWeeklyHours,
} from "@/lib/core/taxonomy/signals";
import type { EmploymentCategory, RemoteType, Seniority, VisaSignal } from "@/lib/core/types";
import { asRecord, asString, type RawJobStub } from "@/lib/sources/types";

export type ClassifiedJob = {
  jobCategory: EmploymentCategory;
  remoteType: RemoteType;
  seniority: Seniority;
  requiredSkills: string[];
  languageRequirements: ReturnType<typeof extractLanguageRequirements>;
  visaSponsorshipSignal: VisaSignal;
  studentEnrollmentRequired: boolean;
  minWeeklyHours: number | null;
  maxWeeklyHours: number | null;
  requiredExperienceYears: number | null;
};

export type ClassifyHints = {
  employmentTypeRaw?: string | null;
  remote?: boolean | null;
  hybrid?: boolean | null;
  onsite?: boolean | null;
  workplaceType?: string | null;
};

export function classifyJob(title: string, description: string, hints: ClassifyHints = {}): ClassifiedJob {
  const hours = extractWeeklyHours(description);
  return {
    jobCategory: classifyEmployment(title, description, hints.employmentTypeRaw ?? null),
    remoteType: classifyRemote(title, description, {
      remote: hints.remote,
      hybrid: hints.hybrid,
      onsite: hints.onsite,
      workplaceType: hints.workplaceType,
    }),
    seniority: classifySeniority(title, description),
    requiredSkills: extractSkills(`${title}\n${description}`),
    languageRequirements: extractLanguageRequirements(description),
    visaSponsorshipSignal: detectVisaSignal(description),
    studentEnrollmentRequired: studentEnrollmentRequired(description),
    minWeeklyHours: hours.min,
    maxWeeklyHours: hours.max,
    requiredExperienceYears: extractExperienceYears(description),
  };
}

export function classifyStub(stub: RawJobStub, text: string, title = ""): ClassifiedJob {
  const payload = asRecord(stub.payload);
  const rawType =
    payload ?
      asString(payload.employmentType) ??
      asString(payload.employment_type) ??
      asString(payload.employment_type_code)
    : null;
  return classifyJob(title, text, { employmentTypeRaw: rawType });
}
