export type WizardState = {
  roles: string[];
  employmentTypes: string[];
  workStyles: string[];
  cities: string;
  skills: string[];
  yearsOfExperience: number;
  headline: string;
  studentStatus: boolean;
  relocationOk: boolean;
};

export const INITIAL_STATE: WizardState = {
  roles: [],
  employmentTypes: ["hiwi", "working_student", "full_time"],
  workStyles: ["remote", "hybrid", "onsite"],
  cities: "",
  skills: [],
  yearsOfExperience: 0,
  headline: "",
  studentStatus: false,
  relocationOk: false,
};

export const ROLE_OPTIONS = [
  "Software Engineer",
  "Frontend Engineer",
  "AI Engineer",
  "Backend Engineer",
  "Data Engineer",
  "DevOps",
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "hiwi", label: "HiWi" },
  { value: "working_student", label: "Werkstudent" },
  { value: "full_time", label: "Full-time" },
  { value: "internship", label: "Internship" },
];

export const WORK_STYLE_OPTIONS = [
  { value: "remote", label: "Remote", description: "Work from anywhere" },
  { value: "hybrid", label: "Hybrid", description: "Split time between home and office" },
  { value: "onsite", label: "Onsite", description: "Work from the office" },
];

export const SKILL_SUGGESTIONS = [
  "TypeScript",
  "React",
  "Next.js",
  "Python",
  "SQL",
  "Node.js",
  "Django",
  "FastAPI",
];

export const CITY_EXAMPLES = ["Berlin", "Munich", "Hamburg"];

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  hiwi: "HiWi",
  working_student: "Werkstudent",
  full_time: "Full-time",
  internship: "Internship",
};

export const WORK_STYLE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};
