import { completeOnboarding } from "@/server/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { GERMAN_STATES } from "@/lib/core/types";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Onboarding</p>
      <h1 className="mt-2 text-2xl font-semibold">Tell Stelle what to look for</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You can change all of this later in Profile.
      </p>
      <form action={completeOnboarding} className="mt-8 space-y-4">
        <div className="space-y-1">
          <Label htmlFor="full_name">Name</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="headline">Headline</Label>
          <Input id="headline" name="headline" placeholder="Frontend engineer · React, TypeScript" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Berlin" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="years_of_experience">Years of experience</Label>
          <Input id="years_of_experience" name="years_of_experience" type="number" min="0" step="0.5" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="desired_roles">Desired roles (comma-separated)</Label>
          <Textarea id="desired_roles" name="desired_roles" defaultValue="Software Engineer, Frontend Engineer, AI Engineer" />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Employment types</legend>
          {["hiwi", "working_student", "full_time", "internship"].map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="employment_types" value={t} defaultChecked={t !== "internship"} />
              {t.replace("_", " ")}
            </label>
          ))}
        </fieldset>
        <div className="space-y-1">
          <Label htmlFor="preferred_cities">Preferred cities</Label>
          <Input id="preferred_cities" name="preferred_cities" defaultValue="Berlin, Munich, Hamburg" />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">German states</legend>
          <div className="grid grid-cols-2 gap-1">
            {GERMAN_STATES.map((s) => (
              <label key={s.code} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="german_states" value={s.code} />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Work style</legend>
          {["remote", "hybrid", "onsite"].map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remote_preference" value={t} defaultChecked />
              {t}
            </label>
          ))}
        </fieldset>
        <div className="space-y-1">
          <Label htmlFor="technical_skills">Skills</Label>
          <Textarea id="technical_skills" name="technical_skills" defaultValue="TypeScript, React, Next.js" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="student_status" /> I am currently a student
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="relocation_ok" /> Open to relocating within Germany
        </label>
        <Button type="submit">Save and continue</Button>
      </form>
    </div>
  );
}
