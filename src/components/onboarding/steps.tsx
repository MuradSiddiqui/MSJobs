"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Chip } from "./chip";
import { Toggle } from "./toggle";
import { YearsStepper } from "./stepper";
import {
  CITY_EXAMPLES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_OPTIONS,
  ROLE_OPTIONS,
  SKILL_SUGGESTIONS,
  WORK_STYLE_LABELS,
  WORK_STYLE_OPTIONS,
  type WizardState,
} from "./types";

function toggleIn(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function StepShell({
  number,
  title,
  subtitle,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-[#0E7490]">
          <span className="text-[15px] font-bold text-white">{number}</span>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-[#1E2A3A]">{title}</h2>
          <p className="text-[13px] text-[#667085]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[13px] font-medium text-[#667085]">{children}</p>;
}

export function StepRoles({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  return (
    <StepShell number={1} title="What roles excite you?" subtitle="Pick as many as you like.">
      <div>
        <SectionLabel>Roles</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {ROLE_OPTIONS.map((role) => (
            <Chip
              key={role}
              selected={state.roles.includes(role)}
              onToggle={() => onChange({ roles: toggleIn(state.roles, role) })}
            >
              {role}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Employment type</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
            <Chip
              key={t.value}
              selected={state.employmentTypes.includes(t.value)}
              onToggle={() => onChange({ employmentTypes: toggleIn(state.employmentTypes, t.value) })}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </div>
    </StepShell>
  );
}

export function StepLocation({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const addExampleCity = (city: string) => {
    const current = state.cities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!current.some((c) => c.toLowerCase() === city.toLowerCase())) {
      onChange({ cities: [...current, city].join(", ") });
    }
  };

  return (
    <StepShell number={2} title="Where do you want to work?" subtitle="Choose how you want to work and where.">
      <div>
        <SectionLabel>Work style</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {WORK_STYLE_OPTIONS.map((w) => {
            const selected = state.workStyles.includes(w.value);
            return (
              <button
                key={w.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ workStyles: toggleIn(state.workStyles, w.value) })}
                className={
                  selected
                    ? "rounded-2xl border-2 border-[#0E7490] bg-[#0E7490]/5 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]/40"
                    : "rounded-2xl border-2 border-[#E4E0D3] bg-white p-4 text-left transition-colors hover:border-[#0E7490]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]/40"
                }
              >
                <span className="block text-sm font-semibold text-[#1E2A3A]">{w.label}</span>
                <span className="mt-1 block text-xs text-[#667085]">{w.description}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label htmlFor="preferred_cities" className="mb-2.5 block text-[13px] font-medium text-[#667085]">
          Preferred cities
        </Label>
        <Input
          id="preferred_cities"
          value={state.cities}
          onChange={(e) => onChange({ cities: e.target.value })}
          placeholder="e.g. Berlin, Munich, Hamburg"
          className="border-[#E4E0D3] bg-white"
        />
        <div className="mt-2.5 flex flex-wrap gap-2">
          {CITY_EXAMPLES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => addExampleCity(city)}
              className="rounded-full border border-dashed border-[#E4E0D3] px-3 py-1 text-xs font-medium text-[#667085] transition-colors hover:border-[#0E7490] hover:text-[#0E7490]"
            >
              + {city}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#667085]">Separate multiple cities with commas.</p>
      </div>
    </StepShell>
  );
}

export function StepEdge({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const [customSkill, setCustomSkill] = useState("");
  const customSkills = state.skills.filter((s) => !SKILL_SUGGESTIONS.includes(s));

  const addCustomSkill = () => {
    const value = customSkill.replace(/,/g, " ").trim().replace(/\s+/g, " ");
    if (value && !state.skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      onChange({ skills: [...state.skills, value] });
    }
    setCustomSkill("");
  };

  return (
    <StepShell number={3} title="Show your edge" subtitle="Help recruiters see what you bring.">
      <div>
        <SectionLabel>Skills</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {SKILL_SUGGESTIONS.map((skill) => (
            <Chip
              key={skill}
              selected={state.skills.includes(skill)}
              onToggle={() => onChange({ skills: toggleIn(state.skills, skill) })}
            >
              {skill}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSkill();
              }
            }}
            placeholder="e.g. GraphQL"
            aria-label="Add a custom skill"
            className="border-[#E4E0D3] bg-white"
          />
          <button
            type="button"
            onClick={addCustomSkill}
            disabled={!customSkill.trim()}
            className="shrink-0 rounded-lg bg-[#0E7490] px-4 text-sm font-medium text-white transition-colors hover:bg-[#155E75] disabled:opacity-40"
          >
            Add
          </button>
        </div>
        {customSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {customSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0E7490]/10 px-3 py-1.5 text-xs font-medium text-[#155E75]"
              >
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() => onChange({ skills: state.skills.filter((s) => s !== skill) })}
                  className="text-[#0E7490] hover:text-[#155E75]"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <Label className="mb-2.5 block text-[13px] font-medium text-[#667085]">
          Years of experience
        </Label>
        <YearsStepper
          value={state.yearsOfExperience}
          onChange={(v) => onChange({ yearsOfExperience: v })}
        />
      </div>
      <div>
        <Label htmlFor="headline" className="mb-2.5 block text-[13px] font-medium text-[#667085]">
          Headline
        </Label>
        <Input
          id="headline"
          value={state.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          placeholder="Frontend engineer, React and TypeScript"
          className="border-[#E4E0D3] bg-white"
        />
        <p className="mt-2 text-xs text-[#667085]">
          One line recruiters see first. Example: Frontend engineer, React and TypeScript
        </p>
      </div>
    </StepShell>
  );
}

export function StepReview({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const row = (label: string, content: React.ReactNode) => (
    <div className="flex flex-col gap-1.5 border-b border-[#E4E0D3] py-3.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-6">
      <span className="w-36 shrink-0 text-[13px] font-medium text-[#667085]">{label}</span>
      <span className="text-sm text-[#1E2A3A]">{content}</span>
    </div>
  );
  const notSet = <span className="text-[#667085]">Not set</span>;
  const yearsLabel =
    state.yearsOfExperience === 1 ? "1 year" : `${Number.isInteger(state.yearsOfExperience) ? state.yearsOfExperience : state.yearsOfExperience.toFixed(1)} years`;

  return (
    <StepShell number={4} title="Almost done" subtitle="Review your picks and start matching.">
      <div className="rounded-2xl border border-[#E4E0D3] bg-[#F7F5EF] px-5 py-2">
        {row("Roles", state.roles.length > 0 ? state.roles.join(", ") : notSet)}
        {row(
          "Employment type",
          state.employmentTypes.length > 0
            ? state.employmentTypes.map((t) => EMPLOYMENT_TYPE_LABELS[t] ?? t).join(", ")
            : notSet,
        )}
        {row(
          "Work style",
          state.workStyles.length > 0
            ? state.workStyles.map((w) => WORK_STYLE_LABELS[w] ?? w).join(", ")
            : notSet,
        )}
        {row("Preferred cities", state.cities.trim() ? state.cities.trim() : notSet)}
        {row("Skills", state.skills.length > 0 ? state.skills.join(", ") : notSet)}
        {row("Experience", yearsLabel)}
        {row("Headline", state.headline.trim() ? state.headline.trim() : notSet)}
      </div>
      <div className="space-y-3">
        <Toggle
          checked={state.studentStatus}
          onChange={(next) => onChange({ studentStatus: next })}
          label="I am currently a student"
        />
        <Toggle
          checked={state.relocationOk}
          onChange={(next) => onChange({ relocationOk: next })}
          label="Open to relocating within Germany"
        />
      </div>
    </StepShell>
  );
}
