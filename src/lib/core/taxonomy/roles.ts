import { fold } from "../normalize/text";

export const ROLE_FAMILIES = {
  frontend: [
    "frontend",
    "front-end",
    "front end",
    "react",
    "next.js",
    "nextjs",
    "typescript developer",
    "ui engineer",
    "web developer",
  ],
  backend: ["backend", "back-end", "back end", "node.js", "nodejs", "java", "golang", "go engineer"],
  fullstack: ["full stack", "fullstack", "full-stack"],
  software: [
    "software engineer",
    "software developer",
    "softwareentwickler",
    "software entwicklung",
    "informatik",
  ],
  ai: [
    "ai engineer",
    "ml engineer",
    "machine learning",
    "llm engineer",
    "generative ai",
    "applied ai",
    "ai software",
    "ki ingenieur",
    "künstliche intelligenz",
    "kuenstliche intelligenz",
  ],
  data: ["data engineer", "data scientist", "ml ops", "mlops"],
  student: ["student developer", "student research", "working student", "werkstudent"],
} as const;

export type RoleFamily = keyof typeof ROLE_FAMILIES;

export function detectRoleFamilies(title: string, description = ""): RoleFamily[] {
  const blob = fold(`${title} ${description.slice(0, 1500)}`);
  const hits: RoleFamily[] = [];
  for (const [family, terms] of Object.entries(ROLE_FAMILIES) as [RoleFamily, readonly string[]][]) {
    if (terms.some((term) => blob.includes(term))) hits.push(family);
  }
  return hits;
}

export function titleRelevance(desiredRoles: string[], jobTitle: string): number {
  if (desiredRoles.length === 0) return 0.5;
  const job = fold(jobTitle);
  let best = 0;
  for (const role of desiredRoles) {
    const wanted = fold(role);
    if (!wanted) continue;
    if (job === wanted) best = Math.max(best, 1);
    else if (job.includes(wanted) || wanted.includes(job)) best = Math.max(best, 0.85);
    else {
      const jobTokens = new Set(job.split(" ").filter((t) => t.length > 2));
      const roleTokens = wanted.split(" ").filter((t) => t.length > 2);
      if (roleTokens.length === 0) continue;
      const overlap = roleTokens.filter((t) => jobTokens.has(t)).length / roleTokens.length;
      best = Math.max(best, overlap * 0.8);
    }
  }
  return best;
}
