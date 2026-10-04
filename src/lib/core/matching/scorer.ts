import type {
  MatchResult,
  NormalizedJob,
  Recommendation,
  ScoreBreakdown,
  ScoringWeights,
  UserMatchProfile,
  MatchLabel,
} from "../types";
import { DEFAULT_SCORING_WEIGHTS } from "../types";
import { titleRelevance } from "../taxonomy/roles";
import { skillOverlap } from "../taxonomy/skills";
import { fold, normalizeCompany } from "../normalize/text";
import { lexicalSimilarity } from "./semantic";

export function labelForScore(score: number): MatchLabel {
  if (score >= 90) return "excellent";
  if (score >= 80) return "strong";
  if (score >= 70) return "good";
  if (score >= 60) return "possible";
  return "weak";
}

export function recommendationFor(score: number, missingRequired: number): Recommendation {
  if (score >= 85 && missingRequired <= 1) return "apply";
  if (score >= 75) return "worth_applying";
  if (score >= 60) return "possible_stretch";
  return "low_priority";
}

export function passesEligibility(job: NormalizedJob, profile: UserMatchProfile): boolean {
  const company = normalizeCompany(job.companyName);
  if (profile.excludedCompanies.some((c) => normalizeCompany(c) === company)) return false;
  const blob = fold(`${job.title} ${job.descriptionText}`);
  if (profile.excludedKeywords.some((k) => k && blob.includes(fold(k)))) return false;
  if (job.country !== "DE" && job.country !== "UN") {
    if (!profile.relocationOk && job.remoteType !== "remote") return false;
  }
  return true;
}

export function passesCategoryGate(job: NormalizedJob, profile: UserMatchProfile): boolean {
  if (profile.desiredEmploymentTypes.length === 0) return true;
  if (job.jobCategory === "unknown") return true;
  return profile.desiredEmploymentTypes.includes(job.jobCategory);
}

function scoreRole(job: NormalizedJob, profile: UserMatchProfile): number {
  return titleRelevance(profile.desiredRoles, job.title);
}

function scoreSkills(job: NormalizedJob, profile: UserMatchProfile) {
  return skillOverlap(profile.technicalSkills, job.requiredSkills);
}

function scoreExperience(job: NormalizedJob, profile: UserMatchProfile): number {
  if (job.requiredExperienceYears == null) return 0.7;
  if (profile.yearsOfExperience == null) return 0.5;
  if (profile.yearsOfExperience >= job.requiredExperienceYears) return 1;
  const gap = job.requiredExperienceYears - profile.yearsOfExperience;
  return Math.max(0, 1 - gap / Math.max(job.requiredExperienceYears, 1));
}

function scoreSeniority(job: NormalizedJob, profile: UserMatchProfile): number {
  if (
    job.seniority === "unknown" ||
    !profile.seniorityPreference ||
    profile.seniorityPreference === "unknown"
  ) {
    return 0.7;
  }
  const order = ["intern", "junior", "mid", "senior", "lead"] as const;
  const jobIdx = order.indexOf(job.seniority);
  const userIdx = order.indexOf(profile.seniorityPreference);
  if (jobIdx < 0 || userIdx < 0) return 0.7;
  const distance = Math.abs(jobIdx - userIdx);
  if (distance === 0) return 1;
  if (distance === 1) return 0.7;
  return 0.3;
}

function scoreEducation(job: NormalizedJob, profile: UserMatchProfile): number {
  if (job.studentEnrollmentRequired && !profile.studentStatus) return 0.15;
  if (
    (job.jobCategory === "hiwi" || job.jobCategory === "working_student") &&
    !profile.studentStatus
  ) {
    return 0.25;
  }
  if (job.jobCategory === "full_time" && profile.studentStatus) return 0.55;
  return 0.85;
}

function scoreLocation(job: NormalizedJob, profile: UserMatchProfile): number {
  if (profile.remotePreference.includes("remote") && job.remoteType === "remote") return 1;
  if (job.city && profile.preferredCities.some((c) => fold(c) === fold(job.city ?? ""))) return 1;
  if (job.stateCode && profile.germanStates.includes(job.stateCode)) return 0.85;
  if (job.remoteType === "hybrid" && profile.remotePreference.includes("hybrid")) return 0.75;
  if (profile.relocationOk) return 0.6;
  if (job.remoteType === "remote") return 0.7;
  return 0.35;
}

function scoreLanguage(job: NormalizedJob, profile: UserMatchProfile): number {
  if (job.languageRequirements.length === 0) return 0.8;
  const userLangs = new Set(profile.languages.map((l) => fold(l.language)));
  let hits = 0;
  for (const req of job.languageRequirements) {
    if (userLangs.has(fold(req.language))) hits += 1;
    else if (req.required) return 0.25;
  }
  return hits / job.languageRequirements.length;
}

export async function scoreJob(
  job: NormalizedJob,
  profile: UserMatchProfile,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
): Promise<MatchResult> {
  const skills = scoreSkills(job, profile);
  const semantic = lexicalSimilarity(
    `${profile.headline ?? ""} ${profile.summary ?? ""} ${profile.experienceText} ${profile.technicalSkills.join(" ")}`,
    `${job.title} ${job.descriptionText}`,
  );

  const ratios = {
    roleMatch: scoreRole(job, profile),
    skillsMatch: skills.ratio,
    experienceMatch: scoreExperience(job, profile),
    seniorityMatch: scoreSeniority(job, profile),
    educationMatch: scoreEducation(job, profile),
    locationMatch: scoreLocation(job, profile),
    languageMatch: scoreLanguage(job, profile),
    semanticMatch: semantic,
  };

  const active = Object.entries(weights) as [keyof ScoreBreakdown, number][];
  const totalWeight = active.reduce((sum, [key, weight]) => {
    if (weight <= 0) return sum;
    return sum + weight;
  }, 0);

  const breakdown: ScoreBreakdown = {
    roleMatch: 0,
    skillsMatch: 0,
    experienceMatch: 0,
    seniorityMatch: 0,
    educationMatch: 0,
    locationMatch: 0,
    languageMatch: 0,
    semanticMatch: 0,
  };

  let points = 0;
  for (const [key, weight] of active) {
    if (weight <= 0 || totalWeight === 0) continue;
    const contribution = ratios[key] * weight;
    breakdown[key] = Math.round(contribution * 10) / 10;
    points += contribution;
  }

  const overallScore = Math.round((points / (totalWeight || 1)) * 100);
  const strengths: string[] = [];
  const concerns: string[] = [];
  if (ratios.roleMatch >= 0.7) strengths.push("Role title aligns with your targets");
  if (skills.matched.length) strengths.push(`Matched skills: ${skills.matched.slice(0, 6).join(", ")}`);
  if (ratios.locationMatch >= 0.8) strengths.push("Location / remote fit");
  if (skills.missing.length) concerns.push(`Missing skills: ${skills.missing.slice(0, 6).join(", ")}`);
  if (job.studentEnrollmentRequired && !profile.studentStatus) {
    concerns.push("Student enrollment appears required");
  }
  if (ratios.experienceMatch < 0.5 && job.requiredExperienceYears) {
    concerns.push(`Position asks for about ${job.requiredExperienceYears} years of experience`);
  }

  return {
    overallScore,
    breakdown,
    matchedSkills: skills.matched,
    missingSkills: skills.missing,
    strengths,
    concerns,
    label: labelForScore(overallScore),
    recommendation: recommendationFor(overallScore, skills.missing.length),
  };
}
