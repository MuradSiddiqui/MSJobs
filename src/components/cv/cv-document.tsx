"use client";

import type { ReactNode } from "react";
import type { ResumeParseResult } from "@/lib/core/schemas/ai";

type Doc = Partial<ResumeParseResult>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "";
  const t = raw.trim();
  if (!t) return "";
  if (/present/i.test(t)) return "Present";
  const m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(t);
  if (m) {
    const month = MONTHS[Number(m[2]) - 1];
    return month ? `${month} ${m[1]}` : t;
  }
  return t;
}

function dateRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = formatDate(start);
  const e = formatDate(end) || "Present";
  if (!s) return e;
  return `${s} - ${e}`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h2 className="border-b border-border pb-1 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="text-[10.5px] font-bold tracking-[0.12em] text-accent uppercase">
        {title}
      </h3>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function Marker() {
  return (
    <span
      aria-hidden
      className="mt-[7px] size-1.5 shrink-0 rotate-45 bg-accent/70 print:bg-neutral-500"
    />
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-1.5 space-y-1">
      {items.map((b, j) => (
        <li key={j} className="flex gap-2 text-[13px] leading-relaxed text-foreground/90">
          <Marker />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

type SkillGroup = { label: string; items: string[] };

function skillGroups(data: Doc): SkillGroup[] {
  const groups: SkillGroup[] = [];
  const strengths = data.technicalStrengths ?? [];
  if (strengths.length > 0) {
    for (const s of strengths) {
      const items = s.items
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (s.category && items.length > 0) groups.push({ label: s.category, items });
    }
    return groups;
  }
  const push = (label: string, items?: string[]) => {
    if (items && items.length > 0) groups.push({ label, items });
  };
  push("Languages", data.programmingLanguages);
  push("Frameworks", data.frameworks);
  push("Databases", data.databases);
  push("Cloud", data.cloudTechnologies);
  push("AI / ML", data.aiTechnologies);
  push("Skills", data.skills);
  return groups;
}

const PRINT_CSS = `
@media print {
  .cv-paper {
    --foreground: oklch(0.22 0.025 255);
    --card: #ffffff;
    --muted: oklch(0.96 0.008 95);
    --muted-foreground: oklch(0.48 0.02 255);
    --border: oklch(0.88 0.015 95);
    --accent: oklch(0.42 0.07 195);
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .cv-paper-entry {
    break-inside: avoid;
  }
}
`;

export function CvDocument({ data }: { data: Doc }) {
  const groups = skillGroups(data);
  const languages = data.spokenLanguages ?? [];
  const certifications = data.certifications ?? [];
  const hasSidebar = groups.length > 0 || languages.length > 0 || certifications.length > 0;

  const contact = [data.email, data.phone, data.location, data.linkedin].filter(
    Boolean,
  ) as string[];

  return (
    <>
      <style>{PRINT_CSS}</style>
      <article className="cv-paper w-full overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-sm">
        <header className="border-b border-border px-6 py-5 sm:px-7">
          <h1 className="font-display text-[22px] leading-tight font-bold tracking-tight">
            {data.name || "Your name"}
          </h1>
          {data.headline ? (
            <p className="mt-0.5 text-[13.5px] font-medium text-accent">{data.headline}</p>
          ) : null}
          {contact.length > 0 ? (
            <p className="mt-1.5 text-[12px] text-muted-foreground">{contact.join(" · ")}</p>
          ) : null}
        </header>

        <div className="grid md:grid-cols-[230px_minmax(0,1fr)]">
          {hasSidebar ? (
            <aside className="border-b border-border bg-muted/40 px-6 py-5 sm:px-5 md:border-r md:border-b-0">
              {groups.length > 0 ? (
                <SidebarSection title="Skills">
                  <div className="space-y-2.5">
                    {groups.map((g, i) => (
                      <div key={i}>
                        <p className="text-[11.5px] font-semibold text-foreground/80">{g.label}</p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                          {g.items.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </SidebarSection>
              ) : null}

              {languages.length > 0 ? (
                <SidebarSection title="Languages">
                  <ul className="space-y-1">
                    {languages.map((l, i) => (
                      <li key={i} className="text-[12.5px] text-muted-foreground">
                        <span className="font-medium text-foreground/85">{l.language}</span>
                        {l.level ? ` · ${l.level}` : ""}
                      </li>
                    ))}
                  </ul>
                </SidebarSection>
              ) : null}

              {certifications.length > 0 ? (
                <SidebarSection title="Certifications">
                  <ul className="space-y-1">
                    {certifications.map((c, i) => (
                      <li key={i} className="flex gap-1.5 text-[12.5px] text-muted-foreground">
                        <Marker />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </SidebarSection>
              ) : null}
            </aside>
          ) : null}

          <div className="min-w-0 px-6 py-5 sm:px-7">
            {data.summary ? (
              <Section title="Professional Summary">
                <p className="text-[13px] leading-relaxed text-foreground/90">{data.summary}</p>
              </Section>
            ) : null}

            {(data.workExperience ?? []).length > 0 ? (
              <Section title="Experience">
                <div className="divide-y divide-border">
                  {(data.workExperience ?? []).map((job, i) => (
                    <div key={i} className="cv-paper-entry py-3 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="min-w-0 text-[14px]">
                          <span className="font-bold">{job.role}</span>
                          <span className="text-muted-foreground">, {job.company}</span>
                        </p>
                        <p className="w-36 shrink-0 text-right text-[11.5px] whitespace-nowrap text-muted-foreground">
                          {dateRange(job.startDate, job.endDate)}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                      </div>
                      <Bullets items={[...(job.responsibilities ?? []), ...(job.achievements ?? [])]} />
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {(data.projects ?? []).length > 0 ? (
              <Section title="Projects">
                <div className="divide-y divide-border">
                  {(data.projects ?? []).map((p, i) => (
                    <div key={i} className="cv-paper-entry py-3 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="text-[13.5px] font-bold">{p.name}</p>
                        {p.startDate || p.endDate ? (
                          <p className="w-32 shrink-0 text-right text-[11.5px] whitespace-nowrap text-muted-foreground">
                            {dateRange(p.startDate, p.endDate)}
                          </p>
                        ) : null}
                      </div>
                      {p.description ? (
                        <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/90">
                          {p.description}
                        </p>
                      ) : null}
                      {(p.skills ?? []).length > 0 ? (
                        <p className="mt-1 text-[12px] text-muted-foreground">
                          {(p.skills ?? []).join(" · ")}
                        </p>
                      ) : null}
                      <Bullets items={p.bullets ?? []} />
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {(data.education ?? []).length > 0 ? (
              <Section title="Education">
                <div className="divide-y divide-border">
                  {(data.education ?? []).map((e, i) => (
                    <div
                      key={i}
                      className="cv-paper-entry flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                    >
                      <p className="min-w-0 text-[13.5px]">
                        <span className="font-bold">
                          {[e.degree, e.field].filter(Boolean).join(" ")}
                        </span>
                        <span className="text-muted-foreground">, {e.institution}</span>
                      </p>
                      <p className="w-32 shrink-0 text-right text-[11.5px] whitespace-nowrap text-muted-foreground">
                        {dateRange(e.startDate, e.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {(data.achievements ?? []).length > 0 ? (
              <Section title="Achievements">
                <div className="divide-y divide-border">
                  {(data.achievements ?? []).map((a, i) => (
                    <div key={i} className="cv-paper-entry py-2.5 first:pt-0 last:pb-0">
                      <p className="text-[13.5px] font-bold">
                        {a.title}
                        {a.organization ? (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · {a.organization}
                          </span>
                        ) : null}
                      </p>
                      <Bullets items={a.bullets ?? []} />
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}
          </div>
        </div>
      </article>
    </>
  );
}
