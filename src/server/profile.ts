"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: boolean; error?: string };

function parseList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const roles = parseList(formData.get("desired_roles"));
  const cities = parseList(formData.get("preferred_cities"));
  const skills = parseList(formData.get("technical_skills"));
  const types = formData.getAll("employment_types").map(String);
  const workStyles = formData.getAll("remote_preference").map(String);

  // The wizard does not ask for a name (it comes from signup), so full_name
  // is left untouched. German states were dropped from the wizard as
  // redundant. Location is derived from the first preferred city.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      headline: String(formData.get("headline") ?? ""),
      location: cities[0] ?? "",
      years_of_experience: Number(formData.get("years_of_experience") || 0),
      student_status: formData.get("student_status") === "on",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (profileError) {
    return { ok: false, error: "Could not save your profile. Please try again." };
  }

  // Upsert, not update: if the preferences row is missing (e.g. the signup
  // trigger never ran), a plain update silently writes zero rows and all
  // onboarding data is lost.
  const { error: prefsError } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      desired_roles: roles,
      preferred_cities: cities,
      technical_skills: skills,
      employment_types: types,
      relocation_ok: formData.get("relocation_ok") === "on",
      remote_preference: workStyles,
    },
    { onConflict: "user_id" },
  );
  if (prefsError) {
    return { ok: false, error: "Could not save your preferences. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? ""),
      headline: String(formData.get("headline") ?? ""),
      location: String(formData.get("location") ?? ""),
      years_of_experience: Number(formData.get("years_of_experience") || 0),
      current_education: String(formData.get("current_education") ?? ""),
      student_status: formData.get("student_status") === "on",
      visa_sponsorship_needed: formData.get("visa_sponsorship_needed") === "on",
    })
    .eq("id", userId);
  if (profileError) {
    return { ok: false, error: "Could not save your profile. Please try again." };
  }

  const { error: prefsError } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      desired_roles: parseList(formData.get("desired_roles")),
      technical_skills: parseList(formData.get("technical_skills")),
      preferred_cities: parseList(formData.get("preferred_cities")),
      excluded_companies: parseList(formData.get("excluded_companies")),
      excluded_keywords: parseList(formData.get("excluded_keywords")),
      preferred_keywords: parseList(formData.get("preferred_keywords")),
      employment_types: formData.getAll("employment_types").map(String),
      german_states: formData.getAll("german_states").map(String),
      remote_preference: formData.getAll("remote_preference").map(String),
      relocation_ok: formData.get("relocation_ok") === "on",
      min_match_score: Number(formData.get("min_match_score") || 0),
    },
    { onConflict: "user_id" },
  );
  if (prefsError) {
    return { ok: false, error: "Could not save your preferences. Please try again." };
  }

  revalidatePath("/profile");
  return { ok: true };
}
