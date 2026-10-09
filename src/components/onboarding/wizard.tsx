"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/server/profile";
import { Button } from "@/components/ui/button";
import { StepEdge, StepLocation, StepReview, StepRoles } from "./steps";
import { INITIAL_STATE, type WizardState } from "./types";

const TOTAL_STEPS = 4;

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<WizardState>) => {
    setState((s) => ({ ...s, ...p }));
    setError(null);
  };

  const percent = ((step + 1) / TOTAL_STEPS) * 100;

  const canContinue =
    step === 0
      ? state.roles.length > 0 && state.employmentTypes.length > 0
      : step === 1
        ? state.workStyles.length > 0
        : true;

  const continueHint =
    step === 0 && state.roles.length === 0
      ? "Pick at least one role to continue."
      : step === 0 && state.employmentTypes.length === 0
        ? "Pick at least one employment type to continue."
        : step === 1 && state.workStyles.length === 0
          ? "Pick at least one work style to continue."
          : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.roles.length === 0) {
      setError("Pick at least one role to continue.");
      setStep(0);
      return;
    }
    const fd = new FormData();
    fd.set("desired_roles", state.roles.join(", "));
    state.employmentTypes.forEach((t) => fd.append("employment_types", t));
    state.workStyles.forEach((w) => fd.append("remote_preference", w));
    fd.set("preferred_cities", state.cities);
    fd.set("technical_skills", state.skills.join(", "));
    fd.set("years_of_experience", String(state.yearsOfExperience));
    fd.set("headline", state.headline.trim());
    if (state.studentStatus) fd.set("student_status", "on");
    if (state.relocationOk) fd.set("relocation_ok", "on");
    startTransition(() => {
      completeOnboarding(fd);
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-[#1E2A3A]">Let&apos;s set you up</h1>
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-[#667085]">
            Step {step + 1} of {TOTAL_STEPS}
          </p>
          <p className="text-[13px] font-semibold text-[#0E7490]">{percent}%</p>
        </div>
        <div
          className="mt-2 h-2 w-full rounded-full bg-[#E4E0D3]"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}
        >
          <div
            className="h-2 rounded-full bg-[#0E7490] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mt-7 rounded-[20px] bg-white p-6 shadow-[0px_8px_24px_0px_rgba(28,41,59,0.1)] sm:p-9">
          {step === 0 && <StepRoles state={state} onChange={patch} />}
          {step === 1 && <StepLocation state={state} onChange={patch} />}
          {step === 2 && <StepEdge state={state} onChange={patch} />}
          {step === 3 && <StepReview state={state} onChange={patch} />}

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-[#B42318]">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
              >
                Back
              </Button>
            ) : (
              <span />
            )}
            {step < TOTAL_STEPS - 1 ? (
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => {
                    setError(null);
                    setStep((s) => s + 1);
                  }}
                  className="bg-[#0E7490] hover:bg-[#155E75]"
                >
                  Continue
                </Button>
                {continueHint && (
                  <p className="text-xs text-[#667085]">{continueHint}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={pending}
                  className="bg-[#0E7490] hover:bg-[#155E75]"
                >
                  {pending ? "Starting..." : "Start matchmaking"}
                </Button>
                <p className="text-xs text-[#667085]">You can change everything later in Profile.</p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
