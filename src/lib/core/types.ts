export const EMPLOYMENT_CATEGORIES = [
  "hiwi",
  "working_student",
  "full_time",
  "internship",
  "thesis",
  "part_time",
  "contract",
  "unknown",
] as const;

export type EmploymentCategory = (typeof EMPLOYMENT_CATEGORIES)[number];

export const REMOTE_TYPES = ["remote", "hybrid", "onsite", "unknown"] as const;
export type RemoteType = (typeof REMOTE_TYPES)[number];

export const SENIORITY_LEVELS = [
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "unknown",
] as const;
export type Seniority = (typeof SENIORITY_LEVELS)[number];

export const VISA_SIGNALS = [
  "unknown",
  "mentioned",
  "not_mentioned",
  "required",
  "provided",
] as const;
export type VisaSignal = (typeof VISA_SIGNALS)[number];

export const APPLICATION_STATUSES = [
  "interested",
  "saved",
  "preparing",
  "applied",
  "recruiter_contact",
  "interview",
  "technical_interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const MATCH_LABELS = [
  "excellent",
  "strong",
  "good",
  "possible",
  "weak",
] as const;
export type MatchLabel = (typeof MATCH_LABELS)[number];

export const RECOMMENDATIONS = [
  "apply",
  "worth_applying",
  "possible_stretch",
  "low_priority",
] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const JOB_SOURCE_NAMES = [
  "arbeitnow",
  "greenhouse",
  "ashby",
  "smartrecruiters",
  "personio",
  "recruitee",
  "lever",
  "teamtailor",
  "bundesagentur",
] as const;
export type JobSourceName = (typeof JOB_SOURCE_NAMES)[number];

export const GERMAN_STATES = [
  { code: "BW", name: "Baden-Württemberg" },
  { code: "BY", name: "Bavaria", aliases: ["Bayern"] },
  { code: "BE", name: "Berlin" },
  { code: "BB", name: "Brandenburg" },
  { code: "HB", name: "Bremen" },
  { code: "HH", name: "Hamburg" },
  { code: "HE", name: "Hesse", aliases: ["Hessen"] },
  { code: "MV", name: "Mecklenburg-Vorpommern" },
  { code: "NI", name: "Lower Saxony", aliases: ["Niedersachsen"] },
  { code: "NW", name: "North Rhine-Westphalia", aliases: ["Nordrhein-Westfalen", "NRW"] },
  { code: "RP", name: "Rhineland-Palatinate", aliases: ["Rheinland-Pfalz"] },
  { code: "SL", name: "Saarland" },
  { code: "SN", name: "Saxony", aliases: ["Sachsen"] },
  { code: "ST", name: "Saxony-Anhalt", aliases: ["Sachsen-Anhalt"] },
  { code: "SH", name: "Schleswig-Holstein" },
  { code: "TH", name: "Thuringia", aliases: ["Thüringen"] },
] as const;

export type GermanStateCode = (typeof GERMAN_STATES)[number]["code"];

export type LanguageRequirement = {
  language: string;
  level: string | null;
  required: boolean;
};

export type NormalizedJob = {
  source: JobSourceName;
  sourceJobId: string;
  sourceUrl: string;
  applyUrl: string | null;
  companyName: string;
  companyLogo: string | null;
  companyWebsite: string | null;
  title: string;
  descriptionHtml: string | null;
  descriptionText: string;
  city: string | null;
  stateCode: GermanStateCode | null;
  country: string;
  remoteType: RemoteType;
  employmentTypeRaw: string | null;
  jobCategory: EmploymentCategory;
  seniority: Seniority;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperienceYears: number | null;
  educationRequirements: string[];
  languageRequirements: LanguageRequirement[];
  visaSponsorshipSignal: VisaSignal;
  studentEnrollmentRequired: boolean;
  minWeeklyHours: number | null;
  maxWeeklyHours: number | null;
  postedAt: Date | null;
  postedAtIsEstimated: boolean;
  canonicalUrl: string;
  rawPayload: unknown;
};

export type ScoreBreakdown = {
  roleMatch: number;
  skillsMatch: number;
  experienceMatch: number;
  seniorityMatch: number;
  educationMatch: number;
  locationMatch: number;
  languageMatch: number;
  semanticMatch: number;
};

export type ScoringWeights = ScoreBreakdown;

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  roleMatch: 15,
  skillsMatch: 25,
  experienceMatch: 20,
  seniorityMatch: 10,
  educationMatch: 10,
  locationMatch: 5,
  languageMatch: 5,
  semanticMatch: 10,
};

export type MatchResult = {
  overallScore: number;
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  label: MatchLabel;
  recommendation: Recommendation;
};

export type UserMatchProfile = {
  desiredRoles: string[];
  desiredEmploymentTypes: EmploymentCategory[];
  preferredCities: string[];
  germanStates: GermanStateCode[];
  remotePreference: RemoteType[];
  relocationOk: boolean;
  yearsOfExperience: number | null;
  currentEducation: string | null;
  studentStatus: boolean;
  technicalSkills: string[];
  languages: { language: string; level: string | null }[];
  preferredWorkingLanguage: string | null;
  seniorityPreference: Seniority | null;
  visaSponsorshipNeeded: boolean;
  excludedCompanies: string[];
  excludedKeywords: string[];
  preferredKeywords: string[];
  headline: string | null;
  summary: string | null;
  experienceText: string;
};
