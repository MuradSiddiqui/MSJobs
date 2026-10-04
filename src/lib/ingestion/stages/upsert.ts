import { createHash } from "node:crypto";
import type { NormalizedJob } from "@/lib/core/types";
import { contentFingerprint, normalizeCompany, normalizeTitle } from "@/lib/core/normalize/text";
import { detectPostingLanguage } from "@/lib/core/taxonomy/posting-language";
import type { AdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert } from "@/lib/supabase/database.types";

export type UpsertResult = {
  jobId: string;
  created: boolean;
};

export function jobFingerprintHash(job: Pick<NormalizedJob, "companyName" | "title" | "city">): string {
  return createHash("sha256")
    .update(contentFingerprint({ company: job.companyName, title: job.title, city: job.city }))
    .digest("hex");
}

export async function upsertCompany(
  admin: AdminClient,
  job: Pick<NormalizedJob, "companyName" | "companyWebsite" | "companyLogo" | "source">,
): Promise<string> {
  const normalized_name = normalizeCompany(job.companyName) || job.companyName.toLowerCase();
  const { data, error } = await admin
    .from("companies")
    .upsert(
      {
        name: job.companyName,
        normalized_name,
        website: job.companyWebsite,
        logo_url: job.companyLogo,
        ats_type: job.source,
      },
      { onConflict: "normalized_name" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

function toJobRow(job: NormalizedJob, companyId: string, fingerprint: string): TablesInsert<"jobs"> {
  return {
    company_id: companyId,
    title: job.title,
    normalized_title: normalizeTitle(job.title),
    description_html: job.descriptionHtml,
    description_text: job.descriptionText,
    city: job.city,
    state_code: job.stateCode,
    country: job.country,
    remote_type: job.remoteType,
    employment_category: job.jobCategory,
    seniority: job.seniority,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    salary_currency: job.salaryCurrency,
    required_skills: job.requiredSkills,
    preferred_skills: job.preferredSkills,
    required_experience_years: job.requiredExperienceYears,
    language_requirements: job.languageRequirements as Json,
    visa_sponsorship_signal: job.visaSponsorshipSignal,
    student_enrollment_required: job.studentEnrollmentRequired,
    min_weekly_hours: job.minWeeklyHours,
    max_weekly_hours: job.maxWeeklyHours,
    source_url: job.sourceUrl,
    apply_url: job.applyUrl,
    canonical_url: job.canonicalUrl || job.sourceUrl,
    content_fingerprint: fingerprint,
    posted_at: job.postedAt ? job.postedAt.toISOString() : null,
    posted_at_is_estimated: job.postedAtIsEstimated,
    posting_language: detectPostingLanguage(job.title, job.descriptionText),
    last_seen_at: new Date().toISOString(),
    is_active: true,
  };
}

async function findExistingJobId(admin: AdminClient, job: NormalizedJob, fingerprint: string): Promise<string | null> {
  const { data: posting, error: postingError } = await admin
    .from("job_source_postings")
    .select("job_id")
    .eq("source", job.source)
    .eq("source_job_id", job.sourceJobId)
    .maybeSingle();
  if (postingError) throw postingError;
  if (posting) return posting.job_id;

  const { data: byFp, error: fpError } = await admin
    .from("jobs")
    .select("id")
    .eq("content_fingerprint", fingerprint)
    .maybeSingle();
  if (fpError) throw fpError;
  if (byFp) return byFp.id;

  if (job.canonicalUrl) {
    const { data: byUrl, error: urlError } = await admin
      .from("jobs")
      .select("id")
      .eq("canonical_url", job.canonicalUrl)
      .maybeSingle();
    if (urlError) throw urlError;
    if (byUrl) return byUrl.id;
  }

  return null;
}

async function replaceSkills(admin: AdminClient, jobId: string, job: NormalizedJob): Promise<void> {
  const { error: delError } = await admin.from("job_skills").delete().eq("job_id", jobId);
  if (delError) throw delError;
  const seen = new Set<string>();
  const rows: { job_id: string; skill: string; kind: string }[] = [];
  for (const [kind, skills] of [
    ["required", job.requiredSkills],
    ["preferred", job.preferredSkills],
  ] as const) {
    for (const skill of skills) {
      const key = `${kind}:${skill.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ job_id: jobId, skill, kind });
    }
  }
  if (rows.length === 0) return;
  const { error } = await admin.from("job_skills").insert(rows);
  if (error) throw error;
}

export async function upsertJob(admin: AdminClient, job: NormalizedJob): Promise<UpsertResult> {
  const companyId = await upsertCompany(admin, job);
  const fingerprint = jobFingerprintHash(job);
  const existingId = await findExistingJobId(admin, job, fingerprint);
  const row = toJobRow(job, companyId, fingerprint);

  let jobId: string;
  let created = false;

  if (existingId) {
    const { error } = await admin.from("jobs").update(row).eq("id", existingId);
    if (error) throw error;
    jobId = existingId;
  } else {
    const { data, error } = await admin.from("jobs").insert(row).select("id").single();
    if (error) throw error;
    jobId = data.id;
    created = true;
  }

  const { error: postingError } = await admin.from("job_source_postings").upsert(
    {
      job_id: jobId,
      source: job.source,
      source_job_id: job.sourceJobId,
      source_url: job.sourceUrl,
      raw_payload: job.rawPayload as Json,
    },
    { onConflict: "source,source_job_id" },
  );
  if (postingError) throw postingError;

  await replaceSkills(admin, jobId, job);
  return { jobId, created };
}

export async function deactivateUnseenJobs(
  admin: AdminClient,
  source: string,
  seenSourceJobIds: Set<string>,
): Promise<number> {
  const { data: postings, error } = await admin
    .from("job_source_postings")
    .select("job_id, source_job_id")
    .eq("source", source);
  if (error) throw error;

  const stale = (postings ?? [])
    .filter((row) => !seenSourceJobIds.has(row.source_job_id))
    .map((row) => row.job_id);
  if (stale.length === 0) return 0;

  let deactivated = 0;
  for (let i = 0; i < stale.length; i += 200) {
    const chunk = stale.slice(i, i + 200);
    const { error: updateError, count } = await admin
      .from("jobs")
      .update({ is_active: false }, { count: "exact" })
      .in("id", chunk)
      .eq("is_active", true);
    if (updateError) throw updateError;
    deactivated += count ?? 0;
  }
  return deactivated;
}
