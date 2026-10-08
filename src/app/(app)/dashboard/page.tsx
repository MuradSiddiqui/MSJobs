import Link from "next/link";
import { Sparkles, Target, Bookmark, Send, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { JobCard } from "@/components/jobs/job-card";
import { companyName, asArray } from "@/lib/relations";
import { isoDaysAgo } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;

  const since = isoDaysAgo(1);
  const [
    { count: newJobs },
    { count: strong },
    { count: saved },
    { count: applied },
    { count: interviews },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gte("first_seen_at", since),
    supabase
      .from("user_job_matches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("overall_score", 80),
    supabase.from("saved_jobs").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "applied"),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["interview", "technical_interview"]),
  ]);

  const { data: top } = await supabase
    .from("user_job_matches")
    .select(
      "overall_score, label, jobs(id, title, city, remote_type, employment_category, effective_posted_at, first_seen_at, posted_at_is_estimated, required_skills, companies(name))",
    )
    .eq("user_id", userId)
    .order("overall_score", { ascending: false })
    .limit(5);

  const { data: fresh } = await supabase
    .from("jobs")
    .select(
      "id, title, city, remote_type, employment_category, effective_posted_at, first_seen_at, posted_at_is_estimated, required_skills, companies(name), user_job_matches!left(overall_score, label)",
    )
    .eq("is_active", true)
    .order("first_seen_at", { ascending: false })
    .limit(5);

  const { data: apps } = await supabase
    .from("applications")
    .select("*, jobs(title, companies(name))")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: savedJobs } = await supabase
    .from("saved_jobs")
    .select(
      "jobs(id, title, city, remote_type, employment_category, effective_posted_at, first_seen_at, posted_at_is_estimated, required_skills, companies(name), user_job_matches!left(overall_score, label, user_id))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    ["New jobs (24h)", newJobs ?? 0, Sparkles],
    ["Strong matches", strong ?? 0, Target],
    ["Saved", saved ?? 0, Bookmark],
    ["Applied", applied ?? 0, Send],
    ["Interviews", interviews ?? 0, Users],
  ] as const;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="animate-fade-up mb-7">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{greeting}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          What changed since you last looked - {newJobs ?? 0} new{" "}
          {(newJobs ?? 0) === 1 ? "role" : "roles"} in the last 24 hours.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, value, Icon], i) => (
          <Card
            key={label}
            className="animate-fade-up p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_10px_28px_oklch(0.22_0.02_255/0.07)]"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className="h-3.5 w-3.5 shrink-0 text-accent/55" />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight">
              {value}
            </p>
          </Card>
        ))}
      </div>
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Top matches</h2>
          <Link href="/jobs?sort=match" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(top ?? []).map((row) => {
            const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
            if (!job) return null;
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
                score={row.overall_score}
                label={row.label ?? "weak"}
              />
            );
          })}
          {(top ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Matches appear after the first ingestion run.</p>
          ) : null}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Newly added</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(fresh ?? []).map((job) => {
            const matches = asArray(job.user_job_matches);
            const match = matches[0];
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
      </section>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Saved</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(savedJobs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Save roles from a job page to pin them here.</p>
          ) : (
            (savedJobs ?? []).map((row) => {
              const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
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
            })
          )}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Recent applications</h2>
        {(apps ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing tracked yet.</p>
        ) : (
          <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-card/90">
            {(apps ?? []).map((app) => {
              const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
              return (
                <li
                  key={app.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {job?.title} · {companyName(job?.companies)}
                  </span>
                  <Link href="/applications" className="shrink-0 font-medium capitalize text-accent">
                    {String(app.status).replaceAll("_", " ")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
