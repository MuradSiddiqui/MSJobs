import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { JobCard } from "@/components/jobs/job-card";
import { companyName, asArray } from "@/lib/relations";

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const { data } = await supabase
    .from("saved_jobs")
    .select(
      "job_id, jobs(id, title, city, remote_type, employment_category, effective_posted_at, first_seen_at, posted_at_is_estimated, required_skills, companies(name), user_job_matches!left(overall_score, label, user_id))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const jobs = (data ?? [])
    .map((row) => (Array.isArray(row.jobs) ? row.jobs[0] : row.jobs))
    .filter(Boolean);

  return (
    <div>
      <PageHeader title="Saved" description="Roles you want to come back to." />
      {jobs.length === 0 ? (
        <EmptyState title="Nothing saved yet" description="Save a job from its detail page." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {jobs.map((job) => {
            if (!job) return null;
            const match = asArray(job.user_job_matches).find((m) => m.user_id === userId);
            return (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                company={companyName(job.companies)}
                city={job.city}
                remoteType={job.remote_type}
                category={job.employment_category}
                postedAt={job.effective_posted_at ?? job.first_seen_at}
                estimated={job.posted_at_is_estimated}
                skills={job.required_skills ?? []}
                score={match?.overall_score}
                label={match?.label}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
