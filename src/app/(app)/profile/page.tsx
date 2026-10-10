import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { updateProfile } from "@/server/profile";
import { GERMAN_STATES } from "@/lib/core/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const { data: prefs } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();

  return (
    <div>
      <PageHeader title="Profile" description="Used for matching. Edit freely after onboarding." />
      <div className="mb-5 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3 text-sm text-muted-foreground">
        Uploading a CV in CV Studio automatically fills your name, headline, location,
        experience, education, and skills here. Review and correct anything it gets wrong.
      </div>
      <form
        action={async (formData: FormData) => {
          "use server";
          const result = await updateProfile(formData);
          if (!result.ok) throw new Error(result.error ?? "Could not save your profile.");
        }}
        className="max-w-xl space-y-4"
      >
        <div className="space-y-1">
          <Label htmlFor="full_name">Name</Label>
          <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="headline">Headline</Label>
          <Input id="headline" name="headline" defaultValue={profile?.headline ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={profile?.location ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="years_of_experience">Years of experience</Label>
          <Input id="years_of_experience" name="years_of_experience" type="number" defaultValue={profile?.years_of_experience ?? 0} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="current_education">Education</Label>
          <Input id="current_education" name="current_education" defaultValue={profile?.current_education ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="desired_roles">Desired roles</Label>
          <Textarea id="desired_roles" name="desired_roles" defaultValue={(prefs?.desired_roles ?? []).join(", ")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="technical_skills">Skills</Label>
          <Textarea id="technical_skills" name="technical_skills" defaultValue={(prefs?.technical_skills ?? []).join(", ")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="preferred_cities">Preferred cities</Label>
          <Input id="preferred_cities" name="preferred_cities" defaultValue={(prefs?.preferred_cities ?? []).join(", ")} />
        </div>
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Employment types</legend>
          {["hiwi", "working_student", "full_time", "internship", "thesis"].map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="employment_types" value={t} defaultChecked={(prefs?.employment_types ?? []).includes(t)} />
              {t.replaceAll("_", " ")}
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">German states</legend>
          <div className="grid grid-cols-2 gap-1">
            {GERMAN_STATES.map((s) => (
              <label key={s.code} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="german_states" value={s.code} defaultChecked={(prefs?.german_states ?? []).includes(s.code)} />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Work style</legend>
          {["remote", "hybrid", "onsite"].map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remote_preference" value={t} defaultChecked={(prefs?.remote_preference ?? []).includes(t)} />
              {t}
            </label>
          ))}
        </fieldset>
        <div className="space-y-1">
          <Label htmlFor="excluded_companies">Excluded companies</Label>
          <Input id="excluded_companies" name="excluded_companies" defaultValue={(prefs?.excluded_companies ?? []).join(", ")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="excluded_keywords">Excluded keywords</Label>
          <Input id="excluded_keywords" name="excluded_keywords" defaultValue={(prefs?.excluded_keywords ?? []).join(", ")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="preferred_keywords">Preferred keywords</Label>
          <Input id="preferred_keywords" name="preferred_keywords" defaultValue={(prefs?.preferred_keywords ?? []).join(", ")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="min_match_score">Hide matches below (%)</Label>
          <Input id="min_match_score" name="min_match_score" type="number" min="0" max="100" defaultValue={prefs?.min_match_score ?? 0} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="student_status" defaultChecked={profile?.student_status} /> Student
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="relocation_ok" defaultChecked={prefs?.relocation_ok} /> Relocation OK
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visa_sponsorship_needed" defaultChecked={profile?.visa_sponsorship_needed} /> Need visa sponsorship
        </label>
        <Button type="submit">Save profile</Button>
      </form>
    </div>
  );
}
