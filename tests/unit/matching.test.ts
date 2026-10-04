import { describe, expect, it } from "vitest";
import { scoreJob, labelForScore } from "@/lib/core/matching/scorer";
import type { NormalizedJob, UserMatchProfile } from "@/lib/core/types";

const job: NormalizedJob = {
  source: "greenhouse",
  sourceJobId: "1",
  sourceUrl: "https://example.com",
  applyUrl: "https://example.com/apply",
  companyName: "Example",
  companyLogo: null,
  companyWebsite: null,
  title: "Frontend Engineer",
  descriptionHtml: null,
  descriptionText: "React TypeScript Next.js Berlin hybrid Vollzeit",
  city: "Berlin",
  stateCode: "BE",
  country: "DE",
  remoteType: "hybrid",
  employmentTypeRaw: "Vollzeit",
  jobCategory: "full_time",
  seniority: "mid",
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: null,
  requiredSkills: ["React", "TypeScript", "Next.js"],
  preferredSkills: [],
  requiredExperienceYears: 3,
  educationRequirements: [],
  languageRequirements: [{ language: "English", level: "C1", required: true }],
  visaSponsorshipSignal: "unknown",
  studentEnrollmentRequired: false,
  minWeeklyHours: null,
  maxWeeklyHours: null,
  postedAt: new Date(),
  postedAtIsEstimated: false,
  canonicalUrl: "https://example.com",
  rawPayload: {},
};

const profile: UserMatchProfile = {
  desiredRoles: ["Frontend Engineer", "Software Engineer"],
  desiredEmploymentTypes: ["full_time"],
  preferredCities: ["Berlin"],
  germanStates: ["BE"],
  remotePreference: ["hybrid", "remote"],
  relocationOk: false,
  yearsOfExperience: 4,
  currentEducation: null,
  studentStatus: false,
  technicalSkills: ["React", "TypeScript", "Next.js", "Node.js"],
  languages: [{ language: "English", level: "C1" }],
  preferredWorkingLanguage: "English",
  seniorityPreference: "mid",
  visaSponsorshipNeeded: false,
  excludedCompanies: [],
  excludedKeywords: [],
  preferredKeywords: [],
  headline: "Frontend engineer",
  summary: "Builds product UI",
  experienceText: "React TypeScript Next.js",
};

describe("matching engine", () => {
  it("scores a clear frontend match in the strong/excellent band", async () => {
    const result = await scoreJob(job, profile);
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.matchedSkills).toContain("React");
    expect(result.missingSkills).toHaveLength(0);
  });

  it("labels score bands", () => {
    expect(labelForScore(92)).toBe("excellent");
    expect(labelForScore(84)).toBe("strong");
    expect(labelForScore(72)).toBe("good");
    expect(labelForScore(61)).toBe("possible");
    expect(labelForScore(40)).toBe("weak");
  });

  it("penalizes missing student enrollment", async () => {
    const baseline = await scoreJob(job, profile);
    const hiwi = { ...job, jobCategory: "hiwi" as const, studentEnrollmentRequired: true };
    const result = await scoreJob(hiwi, profile);
    expect(result.overallScore).toBeLessThan(baseline.overallScore);
    expect(result.breakdown.educationMatch).toBeLessThan(result.breakdown.skillsMatch);
  });
});
