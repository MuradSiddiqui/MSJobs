import { fold, uniqueNormalized } from "../normalize/text";

export const SKILL_DICTIONARY: { canonical: string; aliases: string[] }[] = [
  { canonical: "JavaScript", aliases: ["js", "javascript"] },
  { canonical: "TypeScript", aliases: ["ts", "typescript"] },
  { canonical: "React", aliases: ["react.js", "reactjs"] },
  { canonical: "Next.js", aliases: ["nextjs", "next.js"] },
  { canonical: "Node.js", aliases: ["nodejs", "node.js", "node"] },
  { canonical: "Vue", aliases: ["vue.js", "vuejs"] },
  { canonical: "Angular", aliases: ["angular.js"] },
  { canonical: "Python", aliases: ["python3"] },
  { canonical: "Java", aliases: ["java se", "java ee"] },
  { canonical: "Go", aliases: ["golang"] },
  { canonical: "Rust", aliases: ["rustlang"] },
  { canonical: "C++", aliases: ["cpp", "c plus plus"] },
  { canonical: "C#", aliases: ["csharp", "c sharp"] },
  { canonical: "PHP", aliases: [] },
  { canonical: "Ruby", aliases: ["ruby on rails", "rails"] },
  { canonical: "Kotlin", aliases: [] },
  { canonical: "Swift", aliases: [] },
  { canonical: "SQL", aliases: [] },
  { canonical: "PostgreSQL", aliases: ["postgres", "postgresql"] },
  { canonical: "MySQL", aliases: [] },
  { canonical: "MongoDB", aliases: ["mongo"] },
  { canonical: "Redis", aliases: [] },
  { canonical: "GraphQL", aliases: [] },
  { canonical: "REST", aliases: ["rest api", "restful"] },
  { canonical: "Docker", aliases: [] },
  { canonical: "Kubernetes", aliases: ["k8s"] },
  { canonical: "AWS", aliases: ["amazon web services"] },
  { canonical: "GCP", aliases: ["google cloud"] },
  { canonical: "Azure", aliases: ["microsoft azure"] },
  { canonical: "Terraform", aliases: [] },
  { canonical: "Linux", aliases: [] },
  { canonical: "Git", aliases: [] },
  { canonical: "CI/CD", aliases: ["cicd", "continuous integration"] },
  { canonical: "Tailwind CSS", aliases: ["tailwind", "tailwindcss"] },
  { canonical: "CSS", aliases: [] },
  { canonical: "HTML", aliases: ["html5"] },
  { canonical: "PyTorch", aliases: [] },
  { canonical: "TensorFlow", aliases: [] },
  { canonical: "scikit-learn", aliases: ["sklearn"] },
  { canonical: "Pandas", aliases: [] },
  { canonical: "NumPy", aliases: ["numpy"] },
  { canonical: "LLM", aliases: ["large language model", "llms"] },
  { canonical: "OpenAI", aliases: [] },
  { canonical: "LangChain", aliases: [] },
  { canonical: "Hugging Face", aliases: ["huggingface"] },
  { canonical: "RAG", aliases: ["retrieval augmented"] },
  { canonical: "Prompt Engineering", aliases: ["prompt engineering"] },
  { canonical: "Spark", aliases: ["apache spark"] },
  { canonical: "Kafka", aliases: ["apache kafka"] },
  { canonical: "Elasticsearch", aliases: ["elastic search"] },
  { canonical: "Supabase", aliases: [] },
  { canonical: "Prisma", aliases: [] },
  { canonical: "Django", aliases: [] },
  { canonical: "Flask", aliases: [] },
  { canonical: "FastAPI", aliases: [] },
  { canonical: "Spring", aliases: ["spring boot"] },
  { canonical: "Express", aliases: ["express.js", "expressjs"] },
  { canonical: "NestJS", aliases: ["nest.js"] },
  { canonical: "Svelte", aliases: ["sveltekit"] },
  { canonical: "Flutter", aliases: [] },
  { canonical: "React Native", aliases: ["react-native"] },
  { canonical: "Figma", aliases: [] },
  { canonical: "Jest", aliases: [] },
  { canonical: "Playwright", aliases: [] },
  { canonical: "Cypress", aliases: [] },
  { canonical: "Vitest", aliases: [] },
];

const SKILL_INDEX: { canonical: string; needle: string }[] = [];
for (const skill of SKILL_DICTIONARY) {
  SKILL_INDEX.push({ canonical: skill.canonical, needle: fold(skill.canonical) });
  for (const alias of skill.aliases) {
    SKILL_INDEX.push({ canonical: skill.canonical, needle: fold(alias) });
  }
}
SKILL_INDEX.sort((a, b) => b.needle.length - a.needle.length);

export function extractSkills(text: string): string[] {
  const folded = ` ${fold(text)} `;
  const found: string[] = [];
  for (const { canonical, needle } of SKILL_INDEX) {
    if (needle.length < 2) continue;
    const pattern = new RegExp(`[^a-z0-9+]${escapeReg(needle)}[^a-z0-9+]`);
    if (pattern.test(folded)) found.push(canonical);
  }
  return uniqueNormalized(found);
}

function escapeReg(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function skillOverlap(
  profileSkills: string[],
  jobSkills: string[],
): { matched: string[]; missing: string[]; ratio: number } {
  const profile = new Set(profileSkills.map((s) => fold(s)));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of jobSkills) {
    if (profile.has(fold(skill))) matched.push(skill);
    else missing.push(skill);
  }
  const ratio = jobSkills.length === 0 ? 0.6 : matched.length / jobSkills.length;
  return { matched, missing, ratio };
}
