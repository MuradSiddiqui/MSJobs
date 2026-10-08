import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(8),
  SUPABASE_SECRET_KEY: z.string().min(8).optional(),
  GROQ_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["groq", "ollama"]).default("groq"),
  AI_MODEL: z.string().default("openai/gpt-oss-20b"),
  AI_MODEL_STRONG: z.string().default("openai/gpt-oss-120b"),
  CRON_SECRET: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().email().optional(),
  INGEST_SOURCES: z.string().optional(),
  INGEST_ARBEITNOW: z.string().optional(),
  INGEST_GREENHOUSE: z.string().optional(),
  INGEST_ASHBY: z.string().optional(),
  INGEST_SMARTRECRUITERS: z.string().optional(),
  INGEST_PERSONIO: z.string().optional(),
  INGEST_RECRUITEE: z.string().optional(),
  INGEST_LEVER: z.string().optional(),
  INGEST_TEAMTAILOR: z.string().optional(),
  INGEST_BUNDESAGENTUR: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  cached = parsed.data;
  return cached;
}

export function getPublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  };
}

export function env(): ServerEnv {
  return getServerEnv();
}

export function requireSecret(name: "SUPABASE_SECRET_KEY" | "GROQ_API_KEY" | "CRON_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required secret ${name}`);
  return value;
}

export function isSourceEnabled(name: string): boolean {
  const env = process.env;
  const allow = env.INGEST_SOURCES?.split(",").map((s) => s.trim()).filter(Boolean);
  if (allow && allow.length > 0 && !allow.includes(name)) return false;
  const flag = env[`INGEST_${name.toUpperCase()}`];
  if (flag === "0" || flag === "false") return false;
  return true;
}
