import { describe, expect, it } from "vitest";
import { applySuggestionsToResume } from "@/lib/resume/apply-suggestions";
import type { ResumeParseResult } from "@/lib/core/schemas/ai";

const base: ResumeParseResult = {
  name: "Alex Example",
  headline: "Full-stack developer",
  summary: "Master's student with experience building React apps.",
  location: "Frankfurt",
  workExperience: [
    {
      company: "Acme",
      role: "Intern",
      startDate: "2024",
      endDate: null,
      responsibilities: [
        "Delivered reusable and maintainable UI components that improved design consistency.",
      ],
      achievements: [],
    },
  ],
  skills: ["React"],
  programmingLanguages: ["TypeScript"],
  frameworks: ["Next.js"],
  databases: [],
  cloudTechnologies: [],
  aiTechnologies: [],
  education: [],
  certifications: [],
  achievements: [],
  technicalStrengths: [],
  spokenLanguages: [],
  projects: [],
};

describe("applySuggestionsToResume", () => {
  it("replaces rewrite targets and merges keywords", () => {
    const next = applySuggestionsToResume(base, {
      keywordsToInclude: ["AWS", "Docker"],
      rewrites: [
        {
          original: "Master's student with experience building React apps.",
          suggested: "M.Sc. student focused on backend with Python and AWS.",
        },
        {
          original:
            "Delivered reusable and maintainable UI components that improved design consistency.",
          suggested: "Built well-tested UI components with clean-code principles.",
        },
      ],
    });
    expect(next.summary).toContain("backend");
    expect(next.workExperience[0]?.responsibilities[0]).toContain("clean-code");
    expect(next.skills).toEqual(expect.arrayContaining(["React", "AWS", "Docker"]));
    expect(base.summary).toContain("React apps");
  });
});
