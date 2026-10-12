import { Badge } from "@/components/ui/card";
import { relativeTime, employmentBadge, matchLabelCopy } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";

export function MatchBadge({ score, label }: { score: number; label: string }) {
  const tone =
    score >= 90
      ? "bg-match-excellent/10 text-match-excellent"
      : score >= 80
        ? "bg-match-strong/10 text-match-strong"
        : score >= 70
          ? "bg-match-good/10 text-match-good"
          : score >= 60
            ? "bg-match-possible/10 text-match-possible"
            : "bg-match-weak/10 text-match-weak";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
        tone,
      )}
    >
      {score}% {matchLabelCopy(label)}
    </span>
  );
}

export function EmploymentTypeBadge({ category }: { category: string }) {
  const highlight = category === "hiwi" || category === "working_student";
  return <Badge tone={highlight ? "accent" : "muted"}>{employmentBadge(category)}</Badge>;
}

export function FreshnessBadge({
  postedAt,
  estimated,
}: {
  postedAt: string | null;
  estimated: boolean;
}) {
  if (!postedAt) return <span className="text-xs text-muted-foreground">Date unknown</span>;
  // eslint-disable-next-line react-hooks/purity -- freshness is display-only, computed once per render
  const ageMs = Date.now() - new Date(postedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  // Urgency badges inspired by high-volume apply strategy: fresh jobs first.
  if (ageHours < 4) {
    return (
      <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
        HOT · {relativeTime(postedAt)}
      </span>
    );
  }
  if (ageHours < 24) {
    return (
      <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
        NEW · {relativeTime(postedAt)}
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      {estimated ? "Discovered" : "Posted"} {relativeTime(postedAt)}
    </span>
  );
}

export function JobCard({
  id,
  title,
  company,
  city,
  remoteType,
  category,
  postedAt,
  estimated,
  skills,
  score,
  label,
  source,
  postingLanguage,
}: {
  id: string;
  title: string;
  company: string;
  city: string | null;
  remoteType: string;
  category: string;
  postedAt: string | null;
  estimated: boolean;
  skills: string[];
  score?: number | null;
  label?: string | null;
  source?: string | null;
  postingLanguage?: string | null;
}) {
  const location = [city, remoteType !== "unknown" ? remoteType : null].filter(Boolean).join(" · ");
  return (
    <article className="group relative flex flex-col rounded-xl border border-border/80 bg-card/95 p-4 shadow-[0_1px_2px_oklch(0.22_0.02_255/0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_8px_24px_oklch(0.22_0.02_255/0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/jobs/${id}`}
            className="font-medium leading-snug transition-colors group-hover:text-accent"
          >
            {title}
          </Link>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="truncate">{company}</span>
          </p>
        </div>
        <EmploymentTypeBadge category={category} />
      </div>
      {location ? (
        <p className="mt-2.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {location}
        </p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <FreshnessBadge postedAt={postedAt} estimated={estimated} />
        {postingLanguage === "en" ? <Badge tone="accent">English</Badge> : null}
        {postingLanguage === "de" ? <Badge>Deutsch</Badge> : null}
        {source ? <Badge>{source}</Badge> : null}
      </div>
      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {skills.slice(0, 5).map((skill) => (
            <Badge key={skill}>{skill}</Badge>
          ))}
          {skills.length > 5 ? <Badge tone="muted">+{skills.length - 5} more</Badge> : null}
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
        {score != null && label ? (
          <MatchBadge score={score} label={label} />
        ) : (
          <span className="text-xs text-muted-foreground">Score pending…</span>
        )}
        <Link
          href={`/jobs/${id}`}
          className="flex items-center gap-0.5 text-sm font-medium text-accent opacity-80 transition-opacity group-hover:opacity-100"
        >
          View job
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function MatchBreakdown({
  breakdown,
}: {
  breakdown: Record<string, number>;
}) {
  const rows: [string, string][] = [
    ["roleMatch", "Role"],
    ["skillsMatch", "Skills"],
    ["experienceMatch", "Experience"],
    ["seniorityMatch", "Seniority"],
    ["educationMatch", "Education"],
    ["locationMatch", "Location"],
    ["languageMatch", "Language"],
    ["semanticMatch", "Semantic"],
  ];
  return (
    <dl className="space-y-2">
      {rows.map(([key, name]) => {
        const value = breakdown[key] ?? 0;
        const max =
          key === "roleMatch"
            ? 15
            : key === "skillsMatch"
              ? 25
              : key === "experienceMatch"
                ? 20
                : key === "seniorityMatch" || key === "educationMatch" || key === "semanticMatch"
                  ? 10
                  : 5;
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs">
              <dt>{name}</dt>
              <dd className="tabular-nums">
                {value}/{max}
              </dd>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
