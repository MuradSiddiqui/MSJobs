import { parseLocation } from "@/lib/core/normalize/location";
import { compactWhitespace, stripTrackingParams, uniqueNormalized } from "@/lib/core/normalize/text";
import type { GermanStateCode, NormalizedJob } from "@/lib/core/types";
import { classifyJob } from "@/lib/sources/classify";
import { htmlToPlainText, sanitizeDescriptionHtml } from "@/lib/sources/html";

export type NormalizedJobPartial = {
  source: NormalizedJob["source"];
  sourceJobId: string;
  sourceUrl: string;
  applyUrl?: string | null;
  companyName: string;
  companyLogo?: string | null;
  companyWebsite?: string | null;
  title: string;
  descriptionHtml?: string | null;
  descriptionText?: string | null;
  locationRaw?: string | null;
  city?: string | null;
  stateCode?: GermanStateCode | null;
  country?: string;
  remoteHint?: boolean | null;
  hybridHint?: boolean | null;
  onsiteHint?: boolean | null;
  workplace?: string | null;
  employmentTypeRaw?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  requiredSkills?: string[];
  preferredSkills?: string[];
  minWeeklyHours?: number | null;
  maxWeeklyHours?: number | null;
  postedAt?: Date | null;
  postedAtIsEstimated?: boolean;
  canonicalUrl?: string;
  rawPayload: unknown;
};

export function finishNormalized(partial: NormalizedJobPartial): NormalizedJob {
  const title = compactWhitespace(partial.title);
  const sanitized = partial.descriptionHtml ? sanitizeDescriptionHtml(partial.descriptionHtml) : "";
  const descriptionHtml = sanitized.trim() ? sanitized : null;
  const descriptionText =
    compactWhitespace(partial.descriptionText ?? "") ||
    (descriptionHtml ? htmlToPlainText(descriptionHtml) : "") ||
    "";

  const locationRaw =
    partial.locationRaw ??
    [partial.city, partial.country].filter((part): part is string => Boolean(part)).join(", ");
  const parsed = parseLocation(locationRaw || null);
  const country = parsed.looksGerman ? "DE" : parsed.country;

  const classified = classifyJob(title, descriptionText, {
    employmentTypeRaw: partial.employmentTypeRaw,
    remote: partial.remoteHint,
    hybrid: partial.hybridHint,
    onsite: partial.onsiteHint,
    workplaceType: partial.workplace,
  });

  const hoursFromText = {
    min: classified.minWeeklyHours,
    max: classified.maxWeeklyHours,
  };

  const sourceUrl = partial.sourceUrl.trim();
  const canonicalUrl = stripTrackingParams(partial.canonicalUrl ?? sourceUrl);

  return {
    source: partial.source,
    sourceJobId: partial.sourceJobId,
    sourceUrl,
    applyUrl: partial.applyUrl ? stripTrackingParams(partial.applyUrl) : null,
    companyName: compactWhitespace(partial.companyName) || "Unknown",
    companyLogo: partial.companyLogo ?? null,
    companyWebsite: partial.companyWebsite ?? null,
    title: title || "Untitled",
    descriptionHtml,
    descriptionText,
    city: parsed.city ?? partial.city ?? null,
    stateCode: parsed.stateCode ?? partial.stateCode ?? null,
    country,
    remoteType: classified.remoteType,
    employmentTypeRaw: partial.employmentTypeRaw ?? null,
    jobCategory: classified.jobCategory,
    seniority: classified.seniority,
    salaryMin: partial.salaryMin ?? null,
    salaryMax: partial.salaryMax ?? null,
    salaryCurrency: partial.salaryCurrency ?? null,
    requiredSkills: uniqueNormalized([...(partial.requiredSkills ?? []), ...classified.requiredSkills]),
    preferredSkills: uniqueNormalized(partial.preferredSkills ?? []),
    requiredExperienceYears: classified.requiredExperienceYears,
    educationRequirements: [],
    languageRequirements: classified.languageRequirements,
    visaSponsorshipSignal: classified.visaSponsorshipSignal,
    studentEnrollmentRequired: classified.studentEnrollmentRequired,
    minWeeklyHours: partial.minWeeklyHours ?? hoursFromText.min,
    maxWeeklyHours: partial.maxWeeklyHours ?? hoursFromText.max,
    postedAt: partial.postedAt ?? null,
    postedAtIsEstimated: partial.postedAtIsEstimated ?? false,
    canonicalUrl,
    rawPayload: partial.rawPayload,
  };
}
