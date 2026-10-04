import { passesCategoryGate, passesEligibility, scoreJob } from "./scorer";
import { titleRelevance } from "../taxonomy/roles";
import { skillOverlap } from "../taxonomy/skills";
import type { NormalizedJob, UserMatchProfile } from "../types";

export { scoreJob };

export function shouldScore(job: NormalizedJob, profile: UserMatchProfile): boolean {
  if (!passesEligibility(job, profile)) return false;
  if (!passesCategoryGate(job, profile)) return false;
  const role = titleRelevance(profile.desiredRoles, job.title);
  const skills = skillOverlap(profile.technicalSkills, job.requiredSkills);
  if (role < 0.15 && skills.ratio < 0.12 && profile.desiredRoles.length > 0) return false;
  return true;
}

export function evaluateGate(job: NormalizedJob, profile: UserMatchProfile): { pass: boolean } {
  return { pass: shouldScore(job, profile) };
}

export function shouldRunLlmJobParse(score: number): boolean {
  return score >= 55;
}
