"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const SELECTS: { name: string; label: string; options: [string, string][] }[] = [
  {
    name: "type",
    label: "Employment",
    options: [
      ["", "All types"],
      ["hiwi", "HiWi"],
      ["working_student", "Werkstudent"],
      ["internship", "Internship"],
      ["thesis", "Thesis"],
      ["part_time", "Part-time"],
      ["full_time", "Full-time"],
      ["contract", "Contract"],
    ],
  },
  {
    name: "lang",
    label: "Language",
    options: [
      ["", "Any language"],
      ["en", "English jobs"],
      ["de", "German jobs"],
    ],
  },
  {
    name: "match",
    label: "Match",
    options: [
      ["", "All scores"],
      ["90", "90%+"],
      ["80", "80%+"],
      ["70", "70%+"],
      ["60", "60%+"],
    ],
  },
  {
    name: "posted",
    label: "Posted",
    options: [
      ["", "Any time"],
      ["1", "24 hours"],
      ["3", "3 days"],
      ["7", "7 days"],
      ["14", "14 days"],
    ],
  },
  {
    name: "remote",
    label: "Work style",
    options: [
      ["", "Any"],
      ["remote", "Remote"],
      ["hybrid", "Hybrid"],
      ["onsite", "Onsite"],
    ],
  },
  {
    name: "sort",
    label: "Sort",
    options: [
      ["", "Newest"],
      ["best", "Best match"],
      ["discovered", "Recently discovered"],
      ["company", "Title"],
    ],
  },
];

export function JobFilters() {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const hasActive = SELECTS.some((s) => params.get(s.name)) || Boolean(params.get("q"));

  function set(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    next.delete("cursor");
    router.push(`${path}?${next.toString()}` as Route);
  }

  function clearAll() {
    router.push(path as Route);
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-xl border border-border/80 bg-card/70 p-2.5 shadow-[0_1px_2px_oklch(0.22_0.02_255/0.03)]"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        set("q", String(fd.get("q") ?? ""));
      }}
    >
      <input
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search title, company, skill"
        className="h-9 min-w-52 flex-1 rounded-lg border-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
      />
      {SELECTS.map((select) => (
        <select
          key={select.name}
          aria-label={select.label}
          className="h-9 rounded-lg border border-border/70 bg-background/80 px-2.5 text-sm outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-ring"
          value={params.get(select.name) ?? ""}
          onChange={(e) => set(select.name, e.target.value)}
        >
          {select.options.map(([value, label]) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </select>
      ))}
      {hasActive ? (
        <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
          Clear filters
        </Button>
      ) : null}
      <Button type="submit" size="sm" variant="outline" className="sr-only">
        Search
      </Button>
      <Link
        href={"/jobs?sort=best" as Route}
        className="px-2 text-xs font-medium text-accent hover:underline"
      >
        Best matches
      </Link>
    </form>
  );
}
