import {
  DEFAULT_SCORING_WEIGHTS,
  GERMAN_STATES,
  type GermanStateCode,
  type LanguageRequirement,
  type NormalizedJob,
  type ScoringWeights,
  type UserMatchProfile,
} from "@/lib/core/types";
import { passesEligibility, scoreJob } from "@/lib/core/matching/scorer";
import type { AdminClient } from "@/lib/supabase/admin";
import type { Json, Tables, TablesInsert } from "@/lib/supabase/database.types";

const SCORER_VERSION = "1";
const STATE_CODES = new Set<string>(GERMAN_STATES.map((s) => s.code));

export type MatchUser = {
  userId: string;
  profile: UserMatchProfile;
  weights: ScoringWeights;
  minMatchScore: number;
  ignoredJobIds: Set<string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asWeights(value: Json | null): ScoringWeights {
  if (!isRecord(value)) return DEFAULT_SCORING_WEIGHTS;
  const next = { ...DEFAULT_SCORING_WEIGHTS };
  for (const key of Object.keys(next) as (keyof ScoringWeights)[]) {
    const n = value[key];
    if (typeof n === "number" && Number.isFinite(n)) next[key] = n;
  }
  return next;
}

function asLanguages(value: Json): UserMatchProfile["languages"] {
  if (!Array.isArray(value)) return [];
  const out: UserMatchProfile["languages"] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.language !== "string") continue;
    out.push({
      language: item.language,
      level: typeof item.level === "string" ? item.level : null,
    });
  }
  return out;
}

function asStateCodes(values: string[]): GermanStateCode[] {
  return values.filter((code): code is GermanStateCode => STATE_CODES.has(code));
}

function asLanguageRequirements(value: Json): LanguageRequirement[] {
  if (!Array.isArray(value)) return [];
  const out: LanguageRequirement[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.language !== "string") continue;
    out.push({
      language: item.language,
      level: typeof item.level === "string" ? item.level : null,
      required: item.required === true,
    });
  }
  return out;
}

export function jobRowToNormalized(
  row: Tables<"jobs">,
  companyName: string,
  sourceJobId = row.id,
): NormalizedJob {
  return {
    source: "arbeitnow",
    sourceJobId,
    sourceUrl: row.source_url ?? row.canonical_url ?? "",
    applyUrl: row.apply_url,
    companyName,
    companyLogo: null,
    companyWebsite: null,
    title: row.title,
    descriptionHtml: row.description_html,
    descriptionText: row.description_text ?? "",
    city: row.city,
    stateCode: row.state_code && STATE_CODES.has(row.state_code) ? (row.state_code as GermanStateCode) : null,
    country: row.country,
    remoteType: row.remote_type,
    employmentTypeRaw: null,
    jobCategory: row.employment_category,
    seniority: row.seniority,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    requiredSkills: row.required_skills,
    preferredSkills: row.preferred_skills,
    requiredExperienceYears: row.required_experience_years,
    educationRequirements: [],
    languageRequirements: asLanguageRequirements(row.language_requirements),
    visaSponsorshipSignal: row.visa_sponsorship_signal,
    studentEnrollmentRequired: row.student_enrollment_required,
    minWeeklyHours: row.min_weekly_hours,
    maxWeeklyHours: row.max_weekly_hours,
    postedAt: row.posted_at ? new Date(row.posted_at) : null,
    postedAtIsEstimated: row.posted_at_is_estimated,
    canonicalUrl: row.canonical_url ?? row.source_url ?? "",
    rawPayload: null,
  };
}

export async function loadOnboardedUsers(admin: AdminClient): Promise<MatchUser[]> {
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, headline, years_of_experience, current_education, student_status")
    .not("onboarding_completed_at", "is", null);
  if (profileError) throw profileError;
  if (!profiles?.length) return [];

  const userIds = profiles.map((p) => p.id);
  const { data: prefs, error: prefError } = await admin
    .from("user_preferences")
    .select("*")
    .in("user_id", userIds);
  if (prefError) throw prefError;

  const { data: ignored, error: ignoredError } = await admin
    .from("ignored_jobs")
    .select("user_id, job_id")
    .in("user_id", userIds);
  if (ignoredError) throw ignoredError;

  const prefsByUser = new Map((prefs ?? []).map((row) => [row.user_id, row]));
  const ignoredByUser = new Map<string, Set<string>>();
  for (const row of ignored ?? []) {
    const set = ignoredByUser.get(row.user_id) ?? new Set<string>();
    set.add(row.job_id);
    ignoredByUser.set(row.user_id, set);
  }

  // CV text feeds the semantic part of the match score. Users without a
  // parsed CV fall back to their onboarding answers only.
  const { data: resumes } = await admin
    .from("resumes")
    .select("id, user_id")
    .in("user_id", userIds)
    .eq("is_active", true);
  const resumeIdByUser = new Map((resumes ?? []).map((r) => [r.user_id, r.id]));
  const resumeIds = [...resumeIdByUser.values()];
  const { data: versions } = resumeIds.length
    ? await admin
        .from("resume_versions")
        .select("resume_id, extracted_text")
        .in("resume_id", resumeIds)
        .eq("parse_status", "succeeded")
    : { data: [] as { resume_id: string; extracted_text: string | null }[] };
  const textByResume = new Map(
    (versions ?? []).map((v) => [v.resume_id, v.extracted_text ?? ""]),
  );

  return profiles.flatMap((profile) => {
    const pref = prefsByUser.get(profile.id);
    if (!pref) return [];
    const resumeId = resumeIdByUser.get(profile.id);
    const experienceText = (resumeId && textByResume.get(resumeId)) || "";
    const matchProfile: UserMatchProfile = {
      desiredRoles: pref.desired_roles,
      desiredEmploymentTypes: pref.employment_types,
      preferredCities: pref.preferred_cities,
      germanStates: asStateCodes(pref.german_states),
      remotePreference: pref.remote_preference,
      relocationOk: pref.relocation_ok,
      yearsOfExperience: profile.years_of_experience,
      currentEducation: profile.current_education,
      studentStatus: profile.student_status,
      technicalSkills: pref.technical_skills,
      languages: asLanguages(pref.languages),
      preferredWorkingLanguage: pref.preferred_working_language,
      seniorityPreference: pref.seniority_preference,
      visaSponsorshipNeeded: pref.visa_sponsorship_needed,
      excludedCompanies: pref.excluded_companies,
      excludedKeywords: pref.excluded_keywords,
      preferredKeywords: pref.preferred_keywords,
      headline: profile.headline,
      summary: null,
      experienceText,
    };
    return [
      {
        userId: profile.id,
        profile: matchProfile,
        weights: asWeights(pref.scoring_weights),
        minMatchScore: pref.min_match_score,
        ignoredJobIds: ignoredByUser.get(profile.id) ?? new Set<string>(),
      },
    ];
  });
}

export async function scoreJobsForUsers(
  admin: AdminClient,
  jobs: { jobId: string; normalized: NormalizedJob }[],
  users: MatchUser[],
): Promise<number> {
  if (jobs.length === 0 || users.length === 0) return 0;
  let written = 0;

  for (const user of users) {
    const rows: TablesInsert<"user_job_matches">[] = [];

    for (const job of jobs) {
      if (user.ignoredJobIds.has(job.jobId)) continue;
      // Always score eligible jobs so the Jobs UI can show a match % on every card.
      // Category/role gates used to skip many student vs full-time rows entirely.
      if (!passesEligibility(job.normalized, user.profile)) continue;
      const result = await scoreJob(job.normalized, user.profile, user.weights);
      rows.push({
        user_id: user.userId,
        job_id: job.jobId,
        overall_score: result.overallScore,
        breakdown: result.breakdown,
        matched_skills: result.matchedSkills,
        missing_skills: result.missingSkills,
        strengths: result.strengths,
        concerns: result.concerns,
        label: result.label,
        recommendation: result.recommendation,
        scorer_version: SCORER_VERSION,
      });
    }

    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await admin.from("user_job_matches").upsert(chunk, { onConflict: "user_id,job_id" });
      if (error) throw error;
      written += chunk.length;
    }
  }

  return written;
}
