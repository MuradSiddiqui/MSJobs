"use server";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SCORING_WEIGHTS,
  GERMAN_STATES,
  type GermanStateCode,
  type ScoringWeights,
  type UserMatchProfile,
} from "@/lib/core/types";
import { passesEligibility, scoreJob } from "@/lib/core/matching/scorer";
import { jobRowToNormalized } from "@/lib/ingestion/stages/match";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { companyName } from "@/lib/relations";

const STATE_CODES = new Set<string>(GERMAN_STATES.map((s) => s.code));
const SCORER_VERSION = "1";

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

/**
 * Score any jobs on the current page that are missing a match row for this user.
 * Runs in the request path so newly ingested jobs show a % without waiting for
 * the next ingest cycle.
 */
export async function ensureScoresForJobs(
  userId: string,
  jobIds: string[],
): Promise<void> {
  if (jobIds.length === 0) return;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_job_matches")
    .select("job_id")
    .eq("user_id", userId)
    .in("job_id", jobIds);
  const have = new Set((existing ?? []).map((r) => r.job_id));
  const missing = jobIds.filter((id) => !have.has(id));
  if (missing.length === 0) return;

  // These four queries are independent of each other; run them in parallel.
  const [profileRes, prefRes, resumeRes, jobsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("headline, years_of_experience, current_education, student_status, onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("resumes")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase.from("jobs").select("*").in("id", missing),
  ]);
  const profile = profileRes.data;
  const pref = prefRes.data;
  const resume = resumeRes.data;
  const jobs = jobsRes.data;

  if (!profile?.onboarding_completed_at) return;
  if (!pref) return;
  if (!jobs?.length) return;

  // The CV text feeds the semantic part of the match score. The version
  // lookup depends on the resume row, the company lookup depends on the
  // jobs; the two are independent of each other, so run them in parallel.
  const companyIds = [...new Set(jobs.map((j) => j.company_id).filter(Boolean))] as string[];
  const [versionRes, companiesRes] = await Promise.all([
    resume
      ? supabase
          .from("resume_versions")
          .select("extracted_text")
          .eq("resume_id", resume.id)
          .eq("parse_status", "succeeded")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null as { extracted_text: string | null } | null }),
    companyIds.length > 0
      ? supabase.from("companies").select("id, name").in("id", companyIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const experienceText = versionRes.data?.extracted_text ?? "";

  const names = new Map<string, string>();
  for (const c of companiesRes.data ?? []) names.set(c.id, c.name);

  const matchProfile: UserMatchProfile = {
    desiredRoles: pref.desired_roles,
    desiredEmploymentTypes: pref.employment_types,
    preferredCities: pref.preferred_cities,
    germanStates: (pref.german_states as string[]).filter(
      (code): code is GermanStateCode => STATE_CODES.has(code),
    ),
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
  const weights = asWeights(pref.scoring_weights);

  const rows = [];
  for (const job of jobs as Tables<"jobs">[]) {
    const normalized = jobRowToNormalized(
      job,
      (job.company_id && names.get(job.company_id)) || companyName(null),
    );
    if (!passesEligibility(normalized, matchProfile)) continue;
    const result = await scoreJob(normalized, matchProfile, weights);
    rows.push({
      user_id: userId,
      job_id: job.id,
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

  if (rows.length === 0) return;
  await supabase.from("user_job_matches").upsert(rows, { onConflict: "user_id,job_id" });
}
