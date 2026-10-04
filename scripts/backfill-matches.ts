import { loadScriptEnv } from "./load-env";
import { jobRowToNormalized, loadOnboardedUsers, scoreJobsForUsers } from "../src/lib/ingestion/stages/match";
import { getAdminClient } from "../src/lib/supabase/admin";

async function main() {
  loadScriptEnv();
  const admin = getAdminClient();
  const users = await loadOnboardedUsers(admin);
  if (users.length === 0) {
    console.log("No onboarded users.");
    process.exit(0);
  }

  const { data: jobs, error: jobError } = await admin.from("jobs").select("*").eq("is_active", true);
  if (jobError) throw jobError;
  if (!jobs?.length) {
    console.log("No active jobs.");
    process.exit(0);
  }

  const companyIds = [...new Set(jobs.map((job) => job.company_id).filter((id): id is string => Boolean(id)))];
  const names = new Map<string, string>();
  for (let i = 0; i < companyIds.length; i += 200) {
    const chunk = companyIds.slice(i, i + 200);
    const { data, error } = await admin.from("companies").select("id, name").in("id", chunk);
    if (error) throw error;
    for (const company of data ?? []) names.set(company.id, company.name);
  }

  const payload = jobs.map((job) => ({
    jobId: job.id,
    normalized: jobRowToNormalized(job, (job.company_id && names.get(job.company_id)) || "Unknown"),
  }));

  const written = await scoreJobsForUsers(admin, payload, users);
  console.log(`Backfilled ${written} match rows for ${users.length} users × ${jobs.length} active jobs.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
