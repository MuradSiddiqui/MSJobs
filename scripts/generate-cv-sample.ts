/**
 * Generates public/samples/stelle-cv-sample.pdf — classic 2-page CV layout
 * matching the Stelle tailored-CV template (same style as Murad-style Google Docs CVs).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderResumePdf } from "../src/lib/resume/render-pdf";
import type { ResumeParseResult } from "../src/lib/core/schemas/ai";

const sample: ResumeParseResult = {
  name: "Alex Example",
  headline: null,
  summary:
    "Master’s student in Computer Science with hands-on experience in frontend, backend, and AI-driven software development. Skilled in Python, TypeScript, React, Next.js, and modern development workflows, with a strong interest in building scalable, reliable applications.",
  location: "Frankfurt, Hesse, Germany",
  email: "alex.example@email.com",
  phone: "(+49) · 17000000000",
  linkedin: "https://www.linkedin.com/in/alex-example/",
  website: "https://www.alexexample.dev",
  github: "https://github.com/alex-example",
  workExperience: [
    {
      company: "Example Digital University",
      role: "Software Engineer",
      employmentType: "Part-time",
      location: "Potsdam, Germany — Remote",
      startDate: "April 2026",
      endDate: "Present",
      responsibilities: [
        "Redesigned and enhanced the frontend using Next.js, React, TypeScript, and MUI, delivering new participant-facing features integrated with existing APIs.",
        "Improved frontend usability by fixing UI bugs, smoothing user flows, and enhancing responsiveness across screens.",
        "Delivered reusable and maintainable UI components that improved design consistency and code quality.",
      ],
      achievements: [],
    },
    {
      company: "Research Institute Example",
      role: "Software Engineer",
      employmentType: "Part-time",
      location: "Frankfurt, Germany — Remote",
      startDate: "April 2025",
      endDate: "March 2026",
      responsibilities: [
        "Contributed to an interactive learning platform by building dashboards with Next.js and Material-UI.",
        "Deployed the application on self-hosted servers using GitLab CI/CD pipelines.",
        "Developed and tested Python/Django backend components for video processing workflows.",
      ],
      achievements: [],
    },
    {
      company: "HashPotato",
      role: "Software Engineer",
      employmentType: "Full-time",
      location: "Karachi, Pakistan",
      startDate: "January 2023",
      endDate: "March 2024",
      responsibilities: [
        "Drove key development initiatives using Python, Django, Node.js, PostgreSQL, and Docker.",
        "Designed and maintained scalable microservices, reducing downtime and improving reliability.",
        "Implemented CI/CD pipelines for automated build, testing, and deployment.",
      ],
      achievements: [],
    },
  ],
  skills: ["Clean Code", "Agile", "TDD"],
  programmingLanguages: ["Python", "JavaScript", "TypeScript", "C/C++", "HTML", "CSS"],
  frameworks: ["React.js", "Next.js", "Material UI", "Tailwind CSS", "Django", "Node.js"],
  databases: ["PostgreSQL", "MySQL", "Supabase", "Redis", "Neo4j"],
  cloudTechnologies: ["Docker", "AWS", "GitLab CI/CD"],
  aiTechnologies: ["LangChain", "RAG", "Vector Search"],
  education: [
    {
      institution: "Frankfurt University of Applied Sciences",
      location: "Frankfurt, Germany",
      degree: "M.Sc.",
      field: "High Integrity Systems",
      startDate: "March 2024",
      endDate: "March 2028",
      notes: null,
    },
    {
      institution: "Institute of Business Management",
      location: "Karachi, Pakistan",
      degree: "B.Sc.",
      field: "Computer Science",
      startDate: "August 2019",
      endDate: "May 2023",
      notes: "50% Merit Scholarship · Grade: 3.49/4.0",
    },
  ],
  certifications: [],
  achievements: [
    {
      title: "Appreciation Award",
      organization: "COMPPEC",
      date: "May 2023",
      location: "Karachi, Pakistan",
      bullets: [
        "Presented the Bachelor’s Thesis project at a national computer project exhibition.",
        "Received an Appreciation Certificate for innovation and technical implementation.",
      ],
    },
  ],
  technicalStrengths: [
    { category: "Languages", items: "Python, JavaScript, TypeScript, C/C++, HTML, CSS" },
    { category: "Frontend", items: "React.js, Next.js, Material UI, Tailwind CSS, ShadCN" },
    { category: "Backend", items: "Node.js, Django, Flask, FastAPI" },
    { category: "AI & Data", items: "LangChain, NumPy, RAG, Vector Search" },
    { category: "Databases", items: "PostgreSQL, MySQL, Supabase, Redis, Neo4j" },
    { category: "DevOps & Cloud", items: "Docker, Jenkins, GitLab CI/CD, AWS" },
    { category: "Practices", items: "SDLC, Clean Code, TDD, Agile" },
  ],
  spokenLanguages: [
    { language: "English", level: "C1" },
    { language: "German", level: "A2" },
  ],
  projects: [
    {
      name: "University Management System – (UniBoard)",
      role: "Bachelor’s Thesis",
      location: "Karachi, Pakistan",
      startDate: "August 2022",
      endDate: "May 2023",
      description: null,
      skills: ["Node.js", "JavaScript", "EJS"],
      bullets: [
        "Engineered a full-stack university management system enabling students and faculty to manage academic resources.",
        "Designed a room scheduling algorithm leveraging weighted logic to optimize allocations.",
      ],
    },
  ],
};

async function main() {
  const pdf = await renderResumePdf(sample, {
    contact: {
      email: sample.email,
      phone: sample.phone,
      linkedin: sample.linkedin,
      website: sample.website,
      github: sample.github,
    },
  });
  const dir = resolve(process.cwd(), "public/samples");
  mkdirSync(dir, { recursive: true });
  const out = resolve(dir, "stelle-cv-sample.pdf");
  writeFileSync(out, pdf);
  console.log(`Wrote ${out} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
