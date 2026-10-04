import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/states";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  EmploymentTypeBadge,
  FreshnessBadge,
  MatchBadge,
  MatchBreakdown,
} from "@/components/jobs/job-card";
import { JobActions } from "@/components/jobs/job-actions";
import { GeneratedDocuments } from "@/components/jobs/generated-documents";
import { recommendationCopy, sourceLabel } from "@/lib/utils";
import { companyName, asArray } from "@/lib/relations";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;

  const { data: job } = await supabase
    .from("jobs")
    .select("*, companies(name, website), job_source_postings(source, source_url)")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  const { data: match } = await supabase
    .from("user_job_matches")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", id)
    .maybeSingle();
  const { data: saved } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("user_id", userId)
    .eq("job_id", id)
    .maybeSingle();
  const { data: ignored } = await supabase
    .from("ignored_jobs")
    .select("job_id")
    .eq("user_id", userId)
    .eq("job_id", id)
    .maybeSingle();
  const { data: docs } = await supabase
    .from("generated_documents")
    .select("id, kind, language, variant, content")
    .eq("user_id", userId)
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  const applyUrl = job.apply_url ?? job.source_url;
  const sources = asArray(job.job_source_postings) as { source: string; source_url: string }[];
  const uniqueSources: { source: string; source_url: string }[] = Array.from(
    new Map(sources.map((s) => [`${s.source}:${s.source_url}`, s] as const)).values(),
  );
  const primarySource = uniqueSources[0];

  return (
    <div>
      <PageHeader
        title={job.title}
        description={companyName(job.companies)}
        actions={
          <JobActions
            jobId={id}
            applyUrl={applyUrl}
            saved={Boolean(saved)}
            ignored={Boolean(ignored)}
          />
        }
      />
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {[job.city, job.remote_type !== "unknown" ? job.remote_type : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <EmploymentTypeBadge category={job.employment_category} />
        <FreshnessBadge
          postedAt={job.effective_posted_at ?? job.first_seen_at}
          estimated={job.posted_at_is_estimated}
        />
        {job.posting_language === "en" ? <Badge tone="accent">English</Badge> : null}
        {job.posting_language === "de" ? <Badge>Deutsch</Badge> : null}
      </div>

      {primarySource ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Extracted from {uniqueSources.length > 1 ? "" : sourceLabel(primarySource.source)}
          </span>
          {uniqueSources.map((s) => (
            <Button key={`${s.source}:${s.source_url}`} asChild size="sm" variant="outline">
              <a href={s.source_url} target="_blank" rel="noreferrer">
                {uniqueSources.length > 1 ? sourceLabel(s.source) : "View original posting"}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ))}
        </div>
      ) : null}

      {match ? (
        <Card className="mt-6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MatchBadge score={match.overall_score} label={match.label ?? "weak"} />
            <span className="text-sm font-medium">
              {recommendationCopy(match.recommendation ?? "low_priority")}
            </span>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-sm font-semibold">Strengths</h2>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {(match.strengths ?? []).map((s: string) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <h2 className="mb-2 mt-4 text-sm font-semibold">Missing or weak</h2>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {(match.missing_skills ?? []).map((s: string) => (
                  <li key={s}>{s}</li>
                ))}
                {(match.concerns ?? []).map((s: string) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <MatchBreakdown breakdown={(match.breakdown as Record<string, number>) ?? {}} />
          </div>
          {match.explanation ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {(match.explanation as { recommendationNarrative?: string }).recommendationNarrative}
            </p>
          ) : null}
        </Card>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No match score yet — run ingestion after setting preferences.
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold">Required skills</h2>
        <div className="flex flex-wrap gap-1">
          {(job.required_skills ?? []).map((s: string) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold">Description</h2>
        <div
          className="prose prose-sm max-w-none text-sm leading-6"
          dangerouslySetInnerHTML={{
            __html: job.description_html || `<p>${job.description_text ?? ""}</p>`,
          }}
        />
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold">Generated documents</h2>
        <GeneratedDocuments docs={docs ?? []} jobId={id} />
      </section>
    </div>
  );
}
