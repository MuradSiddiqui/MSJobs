import { z } from "zod";
import { EMPLOYMENT_CATEGORIES, REMOTE_TYPES, SENIORITY_LEVELS, VISA_SIGNALS } from "../types";

export const JobAnalysisSchema = z.strictObject({
  normalizedRole: z.string(),
  seniority: z.enum(SENIORITY_LEVELS),
  employmentType: z.enum(EMPLOYMENT_CATEGORIES),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  requiredExperienceYears: z.number().nullable(),
  education: z.array(z.string()),
  languageRequirements: z.array(
    z.strictObject({
      language: z.string(),
      level: z.string().nullable(),
      required: z.boolean(),
    }),
  ),
  responsibilities: z.array(z.string()),
  mustHaveRequirements: z.array(z.string()),
  niceToHaveRequirements: z.array(z.string()),
  locationRequirements: z.array(z.string()),
  studentEnrollmentRequired: z.boolean(),
  visaSponsorshipSignal: z.enum(VISA_SIGNALS),
});

export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;

export const ResumeExperienceSchema = z.strictObject({
  company: z.string(),
  role: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  // Groq strict structured output rejects optional properties: every key
  // must be listed in `required`, so missing values are null, not absent.
  location: z.string().nullable(),
  employmentType: z.string().nullable(),
  responsibilities: z.array(z.string()),
  achievements: z.array(z.string()),
});

export const ResumeParseSchema = z.strictObject({
  name: z.string().nullable(),
  headline: z.string().nullable(),
  summary: z.string().nullable(),
  location: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  linkedin: z.string().nullable(),
  website: z.string().nullable(),
  github: z.string().nullable(),
  workExperience: z.array(ResumeExperienceSchema),
  skills: z.array(z.string()),
  programmingLanguages: z.array(z.string()),
  frameworks: z.array(z.string()),
  databases: z.array(z.string()),
  cloudTechnologies: z.array(z.string()),
  aiTechnologies: z.array(z.string()),
  education: z.array(
    z.strictObject({
      institution: z.string(),
      degree: z.string().nullable(),
      field: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      location: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ),
  certifications: z.array(z.string()),
  achievements: z
    .array(
      z.strictObject({
        title: z.string(),
        organization: z.string().nullable(),
        date: z.string().nullable(),
        location: z.string().nullable(),
        bullets: z.array(z.string()),
      }),
    )
    .default([]),
  technicalStrengths: z
    .array(
      z.strictObject({
        category: z.string(),
        items: z.string(),
      }),
    )
    .default([]),
  spokenLanguages: z.array(
    z.strictObject({
      language: z.string(),
      level: z.string().nullable(),
    }),
  ),
  projects: z.array(
    z.strictObject({
      name: z.string(),
      description: z.string().nullable(),
      role: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      location: z.string().nullable(),
      skills: z.array(z.string()),
      bullets: z.array(z.string()).default([]),
    }),
  ),
});

export type ResumeParseResult = z.infer<typeof ResumeParseSchema>;

export const MatchExplanationSchema = z.strictObject({
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  recommendationNarrative: z.string(),
});

export const ResumeSuggestionSchema = z.strictObject({
  keywordsToInclude: z.array(z.string()),
  experienceToEmphasize: z.array(z.string()),
  rewrites: z.array(
    z.strictObject({
      original: z.string(),
      suggested: z.string(),
      reason: z.string(),
    }),
  ),
  missingRequirements: z.array(z.string()),
  irrelevantSections: z.array(z.string()),
});

export const CoverLetterSchema = z.strictObject({
  language: z.enum(["en", "de"]),
  subject: z.string(),
  body: z.string(),
});

export const RemoteTypeSchema = z.enum(REMOTE_TYPES);
