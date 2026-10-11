import Link from "next/link";
import { Sparkles, Target, Bookmark, Send, Users, Upload, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { JobCard } from "@/components/jobs/job-card";
import { companyName, asArray } from "@/lib/relations";
import { isoDaysAgo } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;

  const since = isoDaysAgo(1);
  const weekAgo = isoDaysAgo(7);
  const [
    { count: newJobs },
    { count: newJobsWeek },
    { count: strong },
    { count: saved },
    { count: applied },
    { count: appliedWeek },
    { count: interviews },
    { data: top },
    { data: fresh },
    { data: apps },
    { data: savedJobs },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gte("first_seen_at", since),
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gte("first_seen_at", weekAgo),
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
      .eq("status", "applied")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["interview", "technical_interview"]),
    supabase
      .from("user_job_matches")
      .select(
        "overall_score, label, jobs(id, title, city, remote_type, employment_category, effective_posted_at, first_seen_at, posted_at_is_estimated, required_skills, companies(name))",
      )
      .eq("user_id", userId)
      .order("overall_score", { ascending: false })
      .limit(5),
    supabase
      .from("jobs")
      .select(
        "id, title, city, remote_type, employment_category, effective_posted_at, first_seen_at, posted_at_is_estimated, required_skills, companies(name), user_job_matches!left(overall_score, label)",
      )
      .eq("is_active", true)
      .eq("user_job_matches.user_id", userId)
      .order("first_seen_at", { ascending: false })
      .limit(5),
    supabase
      .from("applications")
      .select("*, jobs(title, companies(name))")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("saved_jobs")
      .select(
        "jobs(id, title, city, remote_type, employment_category, effective_posted_at, first_seen_at, posted_at_is_estimated, required_skills, companies(name), user_job_matches!left(overall_score, label, user_id))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "New jobs (24h)", value: newJobs ?? 0, Icon: Sparkles, trend: `${newJobsWeek ?? 0} in the last 7 days` },
    { label: "Strong matches", value: strong ?? 0, Icon: Target, trend: "80% score or higher" },
    { label: "Saved", value: saved ?? 0, Icon: Bookmark, trend: null },
    { label: "Applied", value: applied ?? 0, Icon: Send, trend: `${appliedWeek ?? 0} this week - volume wins` },
    { label: "Interviews", value: interviews ?? 0, Icon: Users, trend: null },
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
        {stats.map(({ label, value, Icon, trend }, i) => (
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
            {trend ? <p className="mt-1 text-[11px] text-muted-foreground">{trend}</p> : null}
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
            <EmptyState
              title="No matches yet"
              description="Upload your CV in CV Studio and your personalized match scores will appear here."
              action={
                <Button asChild size="sm">
                  <Link href="/cv">
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Go to CV Studio
                  </Link>
                </Button>
              }
            />
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
            <EmptyState
              title="No saved roles"
              description="Save roles from any job page to pin them here for later."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/jobs">
                    <Search className="mr-1.5 h-3.5 w-3.5" />
                    Browse jobs
                  </Link>
                </Button>
              }
            />
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
          <EmptyState
            title="Nothing tracked yet"
            description="Applications you start from a job page will be tracked here."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/jobs">
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  Find roles
                </Link>
              </Button>
            }
          />
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
