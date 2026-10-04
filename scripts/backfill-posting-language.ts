import { loadScriptEnv } from "./load-env";
import { detectPostingLanguage } from "../src/lib/core/taxonomy/posting-language";
import { getAdminClient } from "../src/lib/supabase/admin";

async function main() {
  loadScriptEnv();
  const admin = getAdminClient();
  const { data: jobs, error } = await admin
    .from("jobs")
    .select("id, title, description_text")
    .eq("is_active", true);
  if (error) throw error;

  let updated = 0;
  for (const job of jobs ?? []) {
    const lang = detectPostingLanguage(job.title, job.description_text ?? "");
    const { error: updateError } = await admin
      .from("jobs")
      .update({ posting_language: lang })
      .eq("id", job.id);
    if (updateError) throw updateError;
    updated += 1;
  }
  console.log(`Updated posting_language on ${updated} active jobs.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
