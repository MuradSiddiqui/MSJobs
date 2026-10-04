import type { NormalizedJob } from "../types";
import { extractSkills } from "../taxonomy/skills";
import { extractLanguageRequirements, detectVisaSignal, extractWeeklyHours } from "../taxonomy/signals";
import {
  classifyEmployment,
  classifyRemote,
  classifySeniority,
  extractExperienceYears,
  studentEnrollmentRequired,
} from "../taxonomy/employment";
import { parseLocation } from "../normalize/location";
import { compactWhitespace, stripTrackingParams } from "../normalize/text";
import type { JobSourceName, RemoteType } from "../types";

export type ClassifyInput = {
  source: JobSourceName;
  sourceJobId: string;
  sourceUrl: string;
  applyUrl?: string | null;
  companyName: string;
  companyLogo?: string | null;
  companyWebsite?: string | null;
  title: string;
  descriptionHtml?: string | null;
  descriptionText: string;
  locationRaw?: string | null;
  countryHint?: string | null;
  cityHint?: string | null;
  remoteFlags?: {
    remote?: boolean | null;
    hybrid?: boolean | null;
    onsite?: boolean | null;
    workplaceType?: string | null;
  };
  employmentTypeRaw?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  postedAt?: Date | null;
  postedAtIsEstimated?: boolean;
  rawPayload: unknown;
};

export function classifyAndNormalize(input: ClassifyInput): NormalizedJob {
  const location = parseLocation(input.locationRaw ?? input.cityHint ?? "");
  const country = (input.countryHint?.toUpperCase() ?? location.country) || "DE";
  const blob = `${input.title}\n${input.descriptionText}`;
  const skills = extractSkills(blob);
  const hours = extractWeeklyHours(blob);
  const sourceUrl = stripTrackingParams(input.sourceUrl);
  const applyUrl = input.applyUrl ? stripTrackingParams(input.applyUrl) : null;

  return {
    source: input.source,
    sourceJobId: input.sourceJobId,
    sourceUrl,
    applyUrl,
    companyName: compactWhitespace(input.companyName),
    companyLogo: input.companyLogo ?? null,
    companyWebsite: input.companyWebsite ?? null,
    title: compactWhitespace(input.title),
    descriptionHtml: input.descriptionHtml ?? null,
    descriptionText: input.descriptionText,
    city: input.cityHint ?? location.city,
    stateCode: location.stateCode,
    country,
    remoteType: classifyRemote(input.title, input.descriptionText, input.remoteFlags) as RemoteType,
    employmentTypeRaw: input.employmentTypeRaw ?? null,
    jobCategory: classifyEmployment(input.title, input.descriptionText, input.employmentTypeRaw ?? null),
    seniority: classifySeniority(input.title, input.descriptionText),
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    salaryCurrency: input.salaryCurrency ?? null,
    requiredSkills: skills,
    preferredSkills: [],
    requiredExperienceYears: extractExperienceYears(blob),
    educationRequirements: [],
    languageRequirements: extractLanguageRequirements(blob),
    visaSponsorshipSignal: detectVisaSignal(blob),
    studentEnrollmentRequired: studentEnrollmentRequired(blob),
    minWeeklyHours: hours.min,
    maxWeeklyHours: hours.max,
    postedAt: input.postedAt ?? null,
    postedAtIsEstimated: input.postedAtIsEstimated ?? !input.postedAt,
    canonicalUrl: applyUrl ?? sourceUrl,
    rawPayload: input.rawPayload,
  };
}
