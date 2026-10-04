import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260904000000_init.sql"),
  "utf8",
);

describe("RLS boundary policies", () => {
  it("enables RLS on user-owned tables", () => {
    for (const table of [
      "profiles",
      "user_preferences",
      "resumes",
      "resume_versions",
      "user_job_matches",
      "saved_jobs",
      "ignored_jobs",
      "applications",
      "application_status_history",
      "generated_documents",
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("scopes private rows with auth.uid() policies", () => {
    for (const policy of [
      "profiles_own",
      "prefs_own",
      "resumes_own",
      "resume_versions_own",
      "matches_own",
      "saved_own",
      "ignored_own",
      "applications_own",
      "app_history_own",
      "docs_own",
    ]) {
      expect(sql).toContain(`create policy ${policy}`);
    }
    expect(sql.match(/auth\.uid\(\)/g)?.length ?? 0).toBeGreaterThan(10);
  });

  it("keeps the resumes storage bucket private with owner-only object policies", () => {
    expect(sql).toContain("'resumes'");
    expect(sql).toMatch(/false,\s*\n\s*5242880/);
    expect(sql).toContain("resumes_storage_select");
    expect(sql).toContain("resumes_storage_insert");
    expect(sql).toContain("resumes_storage_delete");
  });

  it("exposes jobs as read-only to authenticated users", () => {
    expect(sql).toContain("create policy jobs_read on public.jobs for select to authenticated using (true)");
    expect(sql).not.toMatch(/create policy jobs_.* for insert/);
  });
});
