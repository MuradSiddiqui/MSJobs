"use client";

import { updateApplicationStatus, saveApplicationNotes } from "@/server/jobs";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AppRow = {
  id: string;
  status: string;
  notes: string;
  nextAction: string;
  appliedAt: string | null;
  updatedAt: string | null;
  title: string;
  company: string;
  url: string;
  score: number | null;
};

const STAGE_META: Record<string, { label: string; dot: string; pill: string }> = {
  interested: { label: "Interested", dot: "bg-muted-foreground", pill: "bg-muted text-muted-foreground" },
  saved: { label: "Saved", dot: "bg-muted-foreground", pill: "bg-muted text-muted-foreground" },
  preparing: { label: "Preparing", dot: "bg-sky-500", pill: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  applied: { label: "Applied", dot: "bg-accent", pill: "bg-accent/10 text-accent" },
  recruiter_contact: { label: "Screening", dot: "bg-blue-500", pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  interview: { label: "Interview", dot: "bg-amber-500", pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  technical_interview: { label: "Tech interview", dot: "bg-amber-500", pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  offer: { label: "Offer", dot: "bg-emerald-500", pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  rejected: { label: "Rejected", dot: "bg-red-400", pill: "bg-red-400/10 text-red-500" },
  withdrawn: { label: "Withdrawn", dot: "bg-muted-foreground", pill: "bg-muted text-muted-foreground" },
};

const FUNNEL = [
  { key: "applied", label: "Applied" },
  { key: "recruiter_contact", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
];

const AVATAR_TONES = [
  "bg-accent/15 text-accent",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function prettyDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function ApplicationsBoard({
  applications,
  statuses,
}: {
  applications: AppRow[];
  statuses: string[];
}) {
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const funnelCounts = useMemo(() => {
    const count = (keys: string[]) =>
      applications.filter((a) => keys.includes(a.status)).length;
    return FUNNEL.map((s) => ({
      ...s,
      n: s.key === "interview" ? count(["interview", "technical_interview"]) : count([s.key]),
    }));
  }, [applications]);

  const upNext = useMemo(() => {
    const interview = applications.find((a) => a.status === "interview" || a.status === "technical_interview");
    if (interview) return interview;
    return applications.find((a) => a.nextAction.trim().length > 0) ?? null;
  }, [applications]);

  const visible = useMemo(() => {
    if (filter === "all") return applications;
    if (filter === "interview")
      return applications.filter((a) => a.status === "interview" || a.status === "technical_interview");
    return applications.filter((a) => a.status === filter);
  }, [applications, filter]);

  const conv = (i: number) => {
    const from = funnelCounts[i]?.n ?? 0;
    const to = funnelCounts[i + 1]?.n ?? 0;
    if (from === 0) return "—";
    return `${Math.round((to / from) * 100)}%`;
  };

  return (
    <div className="space-y-5">
      {/* funnel */}
      <section className="animate-fade-up rounded-2xl border border-border/80 bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Pipeline funnel
        </p>
        <div className="mt-4 flex items-center justify-between gap-1 sm:gap-2">
          {funnelCounts.map((stage, i) => {
            const meta = STAGE_META[stage.key] ?? STAGE_META.applied;
            return (
              <div key={stage.key} className="flex flex-1 items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setFilter(filter === stage.key ? "all" : stage.key)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-muted/60",
                    filter === stage.key && "bg-muted/60 ring-1 ring-accent/40",
                  )}
                >
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold tabular-nums", meta.pill)}>
                    {stage.n}
                  </span>
                  <span className="text-xs font-semibold sm:text-[13px]">{stage.label}</span>
                </button>
                {i < funnelCounts.length - 1 ? (
                  <div className="flex shrink-0 flex-col items-center gap-0.5 pb-8">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
                    <span className="text-[10px] tabular-nums text-muted-foreground/70">{conv(i)}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* up next */}
      {upNext ? (
        <section className="animate-fade-up relative overflow-hidden rounded-2xl bg-[#16202e] p-5 text-white" style={{ animationDelay: "90ms" }}>
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/40 blur-[90px]" />
          <div className="relative flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-accent font-bold leading-none">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-300">
                Up next
              </p>
              <p className="mt-1 truncate text-base font-semibold">
                {upNext.title} @ {upNext.company}
              </p>
              <p className="mt-0.5 truncate text-sm text-white/65">
                {upNext.nextAction.trim() || `Stage: ${(STAGE_META[upNext.status] ?? STAGE_META.applied).label} - keep the momentum going`}
              </p>
            </div>
            <Badge tone="accent" className="border-teal-300/30 bg-teal-300/15 text-teal-200">
              {(STAGE_META[upNext.status] ?? STAGE_META.applied).label}
            </Badge>
          </div>
        </section>
      ) : null}

      {/* filter chips */}
      <div className="flex flex-wrap gap-2">
        {["all", ...statuses].map((s) => {
          const n = s === "all" ? applications.length : applications.filter((a) => a.status === s).length;
          if (s !== "all" && n === 0) return null;
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all",
                active
                  ? "border-foreground bg-foreground text-background shadow"
                  : "border-border/80 bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground",
              )}
            >
              {s === "all" ? "All" : (STAGE_META[s]?.label ?? s.replaceAll("_", " "))}{" "}
              <span className="tabular-nums opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      {/* feed rows */}
      <div className="space-y-2.5">
        {visible.map((app, i) => {
          const meta = STAGE_META[app.status] ?? STAGE_META.applied;
          const open = expanded === app.id;
          return (
            <article
              key={app.id}
              className="animate-fade-up group rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_10px_28px_oklch(0.22_0.02_255/0.07)]"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <div className="flex items-center gap-4">
                <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold", AVATAR_TONES[app.company.length % AVATAR_TONES.length])}>
                  {initials(app.company)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{app.title}</p>
                  <p className="truncate text-[13px] text-muted-foreground">{app.company}</p>
                </div>
                <span className={cn("hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex", meta.pill)}>
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
                <div className="hidden w-16 shrink-0 text-center md:block">
                  {app.score != null ? (
                    <>
                      <p className="text-base font-bold tabular-nums">{app.score}%</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">match</p>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">—</p>
                  )}
                </div>
                <div className="hidden min-w-0 max-w-56 shrink-0 lg:block">
                  <p className="truncate text-xs text-muted-foreground">
                    {app.nextAction.trim() ? `Next: ${app.nextAction}` : "No next step set"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                    Updated {prettyDate(app.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open original posting"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpanded(open ? null : app.id)}
                    aria-expanded={open}
                  >
                    {open ? "Hide" : "Details"}
                  </Button>
                </div>
              </div>
              {open ? (
                <div className="animate-fade-up mt-4 grid gap-3 border-t border-border/70 pt-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">Stage</span>
                    <StatusSelect id={app.id} value={app.status} statuses={statuses} />
                  </label>
                  <div className="text-xs text-muted-foreground">
                    <span className="mb-1 block font-semibold">Applied</span>
                    {prettyDate(app.appliedAt)}
                  </div>
                  <div className="md:col-span-2">
                    <NotesForm id={app.id} notes={app.notes} nextAction={app.nextAction} />
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/80 p-10 text-center text-sm text-muted-foreground">
            Nothing in this stage yet.
          </p>
        ) : null}
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        Motion: rows stagger in on load - funnel counts roll up - stage pill pulses on change.
      </p>
    </div>
  );
}

function StatusSelect({
  id,
  value,
  statuses,
}: {
  id: string;
  value: string;
  statuses: string[];
}) {
  return (
    <select
      className="h-9 w-full rounded-lg border border-border/80 bg-card px-2 text-sm"
      defaultValue={value}
      onChange={(e) => void updateApplicationStatus(id, e.target.value)}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {(STAGE_META[s]?.label ?? s).replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}

function NotesForm({ id, notes, nextAction }: { id: string; notes: string; nextAction: string }) {
  return (
    <form
      className="space-y-2"
      action={(fd) => saveApplicationNotes(id, String(fd.get("notes")), String(fd.get("next")))}
    >
      <textarea
        name="notes"
        defaultValue={notes}
        placeholder="Notes"
        className="h-20 w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-sm"
      />
      <input
        name="next"
        defaultValue={nextAction}
        placeholder="Next action (e.g. follow up Friday)"
        className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-sm"
      />
      <Button type="submit" size="sm" variant="outline">
        Save notes
      </Button>
    </form>
  );
}
