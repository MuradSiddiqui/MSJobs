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
    <section className="mt-6">
      <h2 className="border-b border-[#e4e0d3] pb-1.5 text-[11px] font-bold tracking-[0.14em] text-[#667085] uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function CvDocument({ data }: { data: Doc }) {
  const contact = [
    data.email,
    data.phone,
    data.location,
    data.linkedin,
  ].filter(Boolean) as string[];

  const skillChips = [
    ...(data.skills ?? []),
    ...(data.programmingLanguages ?? []),
    ...(data.frameworks ?? []),
    ...(data.databases ?? []),
    ...(data.cloudTechnologies ?? []),
    ...(data.aiTechnologies ?? []),
  ];

  return (
    <article className="w-full rounded-xl border border-[#e4e0d3] bg-white px-8 py-9 text-[#1e2a3a] shadow-[0_8px_30px_rgb(30_42_58/0.08)] sm:px-12">
      <header className="text-center">
        <h1 className="font-display text-[26px] leading-tight font-bold tracking-tight">
          {data.name || "Your name"}
        </h1>
        {data.headline ? (
          <p className="mt-1 text-[15px] font-medium text-[#0e7490]">{data.headline}</p>
        ) : null}
        {contact.length > 0 ? (
          <p className="mt-2 text-[12.5px] text-[#667085]">{contact.join(" · ")}</p>
        ) : null}
      </header>

      {data.summary ? (
        <Section title="Professional Summary">
          <p className="text-[13.5px] leading-relaxed">{data.summary}</p>
        </Section>
      ) : null}

      {(data.workExperience ?? []).length > 0 ? (
        <Section title="Experience">
          <div className="space-y-5">
            {(data.workExperience ?? []).map((job, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="text-[14.5px]">
                    <span className="font-bold">{job.role}</span>
                    <span className="text-[#667085]">, {job.company}</span>
                  </p>
                  <p className="text-[12px] whitespace-nowrap text-[#667085]">
                    {dateRange(job.startDate, job.endDate)}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                </div>
                <ul className="mt-1.5 list-none space-y-1">
                  {[...(job.responsibilities ?? []), ...(job.achievements ?? [])].map((b, j) => (
                    <li key={j} className="flex gap-2 text-[13.5px] leading-relaxed">
                      <span className="mt-0.5 shrink-0 text-[#0e7490]" aria-hidden>
                        •
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {(data.projects ?? []).length > 0 ? (
        <Section title="Projects">
          <div className="space-y-4">
            {(data.projects ?? []).map((p, i) => (
              <div key={i}>
                <p className="text-[14px] font-bold">{p.name}</p>
                {p.description ? (
                  <p className="mt-0.5 text-[13.5px] leading-relaxed">{p.description}</p>
                ) : null}
                {(p.bullets ?? []).length > 0 ? (
                  <ul className="mt-1.5 list-none space-y-1">
                    {(p.bullets ?? []).map((b, j) => (
                      <li key={j} className="flex gap-2 text-[13.5px] leading-relaxed">
                        <span className="mt-0.5 shrink-0 text-[#0e7490]" aria-hidden>
                          •
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {(data.education ?? []).length > 0 ? (
        <Section title="Education">
          <div className="space-y-3">
            {(data.education ?? []).map((e, i) => (
              <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className="text-[14px]">
                  <span className="font-bold">
                    {[e.degree, e.field].filter(Boolean).join(" ")}
                  </span>
                  <span className="text-[#667085]">, {e.institution}</span>
                </p>
                <p className="text-[12px] whitespace-nowrap text-[#667085]">
                  {dateRange(e.startDate, e.endDate)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {skillChips.length > 0 ? (
        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {skillChips.map((s, i) => (
              <span
                key={i}
                className="rounded-md border border-[#e4e0d3] bg-[#f7f5ef] px-2.5 py-1 text-[12.5px] font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {(data.certifications ?? []).length > 0 ? (
        <Section title="Certifications">
          <ul className="list-none space-y-1">
            {(data.certifications ?? []).map((c, i) => (
              <li key={i} className="flex gap-2 text-[13.5px]">
                <span className="mt-0.5 shrink-0 text-[#0e7490]" aria-hidden>
                  •
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {(data.spokenLanguages ?? []).length > 0 ? (
        <Section title="Languages">
          <p className="text-[13.5px]">
            {(data.spokenLanguages ?? [])
              .map((l) => (l.level ? `${l.language} (${l.level})` : l.language))
              .join(" · ")}
          </p>
        </Section>
      ) : null}

      {(data.achievements ?? []).length > 0 ? (
        <Section title="Achievements">
          <div className="space-y-3">
            {(data.achievements ?? []).map((a, i) => (
              <div key={i}>
                <p className="text-[14px] font-bold">
                  {a.title}
                  {a.organization ? (
                    <span className="font-normal text-[#667085]"> · {a.organization}</span>
                  ) : null}
                </p>
                {(a.bullets ?? []).length > 0 ? (
                  <ul className="mt-1 list-none space-y-1">
                    {(a.bullets ?? []).map((b, j) => (
                      <li key={j} className="flex gap-2 text-[13.5px]">
                        <span className="mt-0.5 shrink-0 text-[#0e7490]" aria-hidden>
                          •
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </article>
  );
}
