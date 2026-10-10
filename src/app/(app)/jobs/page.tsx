import type { Route } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/filter-panel";
import { Button } from "@/components/ui/button";
import { companyName, asArray } from "@/lib/relations";
import { ensureScoresForJobs } from "@/server/ensure-matches";
import { sourceLabel, isoDaysAgo } from "@/lib/utils";

type Search = {
  q?: string;
  type?: string;
  lang?: string;
  match?: string;
  posted?: string;
  remote?: string;
  city?: string;
  state?: string;
  seniority?: string;
  sort?: string;
  cursor?: string;
};

const PAGE_SIZE = 20;

function encodeCursor(postedAt: string, id: string) {
  return Buffer.from(`${postedAt}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(raw: string): { postedAt: string; id: string } | null {
  try {
    const [postedAt, id] = Buffer.from(raw, "base64url").toString("utf8").split("|");
    if (!postedAt || !id) return null;
    return { postedAt, id };
  } catch {
    return null;
  }
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;

  // Jobs are matched against the CV: no usable CV, no job list. The user
  // uploads once on /cv and personalized scores appear here.
  const { data: activeResume } = await supabase
    .from("resumes")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  let parsedCv = false;
  let parseFailed = false;
  if (activeResume) {
    const { data: version } = await supabase
      .from("resume_versions")
      .select("parse_status")
      .eq("resume_id", activeResume.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    parsedCv = version?.parse_status === "succeeded";
    parseFailed = version?.parse_status === "failed";
  }

  if (!parsedCv) {
    return (
      <div>
        <PageHeader
          title="Jobs"
          description="German tech roles scored against your CV — filter by type, freshness, and match."
        />
        <div className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-14 text-center">
          <p className="font-display text-base font-medium tracking-tight">
            {parseFailed ? "Your CV could not be parsed" : "Upload your CV first"}
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            {parseFailed
              ? "Every job here is scored against your CV, but parsing failed. Fix it in CV Studio and your personalized match percentages will appear."
              : "Every job here is scored against your CV. Upload it once and your personalized match percentages will appear."}
          </p>
          <Button asChild className="mt-4">
            <Link href="/cv">{parseFailed ? "Fix in CV Studio" : "Upload CV"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { data: ignored } = await supabase.from("ignored_jobs").select("job_id").eq("user_id", userId);
  const ignoredIds = setOf((ignored ?? []).map((r) => r.job_id));

  // Note: match rows are re-read after scoring below, so the jobs query
  // intentionally skips the user_job_matches join here.
  let query = supabase
    .from("jobs")
    .select(
      "id, title, city, remote_type, employment_category, effective_posted_at, first_seen_at, posted_at_is_estimated, required_skills, posting_language, companies(name), job_source_postings(source)",
    )
    .eq("is_active", true)
    .limit(PAGE_SIZE + 1);

  if (sp.q) query = query.or(`title.ilike.%${sp.q}%,city.ilike.%${sp.q}%`);
  if (sp.type) query = query.eq("employment_category", sp.type);
  if (sp.lang === "en" || sp.lang === "de") query = query.eq("posting_language", sp.lang);
  if (sp.remote) query = query.eq("remote_type", sp.remote);
  if (sp.city) query = query.ilike("city", `%${sp.city}%`);
  if (sp.state) query = query.eq("state_code", sp.state);
  if (sp.seniority) query = query.eq("seniority", sp.seniority);
  if (sp.posted) {
    const days = Number(sp.posted);
    const since = isoDaysAgo(days);
    query = query.gte("effective_posted_at", since);
  }

  const sort = sp.sort ?? "newest";
  if (sort === "company") query = query.order("title").order("id");
  else if (sort === "discovered") {
    query = query.order("first_seen_at", { ascending: false }).order("id", { ascending: false });
  } else {
    query = query
      .order("effective_posted_at", { ascending: false })
      .order("id", { ascending: false });
  }

  const cursor = sp.cursor ? decodeCursor(sp.cursor) : null;
  if (cursor && sort !== "match" && sort !== "best" && sort !== "company") {
    const column = sort === "discovered" ? "first_seen_at" : "effective_posted_at";
    query = query.or(
      `${column}.lt.${cursor.postedAt},and(${column}.eq.${cursor.postedAt},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;

  type MatchRow = {
    job_id: string;
    overall_score: number | null;
    label: string | null;
    user_id: string;
  };
  type JobRow = Omit<NonNullable<typeof data>[number], "user_job_matches"> & {
    user_job_matches: MatchRow[];
  };
  let rows: JobRow[] = (data ?? [])
    .filter((job) => !ignoredIds.has(job.id))
    .map((job) => ({ ...job, user_job_matches: [] as MatchRow[] }));

  // Score any jobs on this page that are missing a match for the current user.
  await ensureScoresForJobs(
    userId,
    rows.map((j) => j.id),
  );

  // Re-read match rows after scoring so the UI shows fresh percentages.
  const pageIds = rows.map((j) => j.id);
  if (pageIds.length > 0) {
    const { data: matches } = await supabase
      .from("user_job_matches")
      .select("job_id, overall_score, label, user_id")
      .eq("user_id", userId)
      .in("job_id", pageIds);
    const byJob = new Map((matches ?? []).map((m) => [m.job_id, m]));
    rows = rows.map((job) => ({
      ...job,
      user_job_matches: byJob.has(job.id) ? [byJob.get(job.id)!] : [],
    }));
  }

  if (sp.match) {
    const min = Number(sp.match);
    rows = rows.filter((job) => {
      const match = asArray(job.user_job_matches).find((m) => m.user_id === userId);
      return (match?.overall_score ?? 0) >= min;
    });
  }

  if (sort === "match" || sort === "best") {
    rows = [...rows].sort((a, b) => {
      const sa =
        asArray(a.user_job_matches).find((m) => m.user_id === userId)?.overall_score ?? 0;
      const sb =
        asArray(b.user_job_matches).find((m) => m.user_id === userId)?.overall_score ?? 0;
      return sb - sa;
    });
  }

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor(
          (sort === "discovered" ? last.first_seen_at : last.effective_posted_at) ??
            last.first_seen_at,
          last.id,
        )
      : null;

  const nextHref = (() => {
    if (!nextCursor) return null;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (key === "cursor" || value == null || value === "") continue;
      params.set(key, value);
    }
    params.set("cursor", nextCursor);
    return `/jobs?${params.toString()}`;
  })();

  const activeFilters = [sp.type, sp.lang, sp.match, sp.posted, sp.remote, sp.q].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="German tech roles scored against your CV — filter by type, freshness, and match."
      />
      <JobFilters />
      {error ? <p className="mt-2 text-sm text-danger">{error.message}</p> : null}
      {page.length === 0 ? (
        <EmptyState
          title="No jobs match these filters"
          description={
            activeFilters > 0
              ? "Try widening your filters. Your board has more roles than this narrow view."
              : "New roles are added automatically. Check back soon."
          }
          action={
            activeFilters > 0 ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/jobs">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            {page.length} {page.length === 1 ? "role" : "roles"}
            {activeFilters > 0 ? " matching your filters" : ""} on this page
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
          {page.map((job) => {
            const match = asArray(job.user_job_matches).find((m) => m.user_id === userId);
            const sources = asArray(job.job_source_postings);
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
                source={sources[0]?.source ? sourceLabel(sources[0].source) : null}
                postingLanguage={job.posting_language}
              />
            );
          })}
          </div>
        </>
      )}
      {nextHref ? (
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline">
            <Link href={nextHref as Route}>Load more roles</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function setOf(ids: string[]) {
  return new Set(ids);
}
