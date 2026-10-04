import { describe, expect, it } from "vitest";
import { ResumeParseSchema, JobAnalysisSchema } from "@/lib/core/schemas/ai";

describe("AI schemas", () => {
  it("rejects extra keys on resume parse (strict)", () => {
    const parsed = ResumeParseSchema.safeParse({
      name: "Ada",
      headline: null,
      summary: null,
      location: null,
      workExperience: [],
      skills: [],
      programmingLanguages: [],
      frameworks: [],
      databases: [],
      cloudTechnologies: [],
      aiTechnologies: [],
      education: [],
      certifications: [],
      spokenLanguages: [],
      projects: [],
      invented: true,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a minimal valid job analysis", () => {
    const parsed = JobAnalysisSchema.safeParse({
      normalizedRole: "Frontend Engineer",
      seniority: "mid",
      employmentType: "full_time",
      requiredSkills: ["React"],
      preferredSkills: [],
      requiredExperienceYears: 3,
      education: [],
      languageRequirements: [],
      responsibilities: [],
      mustHaveRequirements: [],
      niceToHaveRequirements: [],
      locationRequirements: [],
      studentEnrollmentRequired: false,
      visaSponsorshipSignal: "unknown",
    });
    expect(parsed.success).toBe(true);
  });
});
