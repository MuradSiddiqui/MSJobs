"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const roles = String(formData.get("desired_roles") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cities = String(formData.get("preferred_cities") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const skills = String(formData.get("technical_skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const types = formData.getAll("employment_types").map(String);
  const workStyles = formData.getAll("remote_preference").map(String);

  // The wizard does not ask for a name (it comes from signup), so full_name
  // is left untouched. German states were dropped from the wizard as
  // redundant. Location is derived from the first preferred city.
  await supabase.from("profiles").update({
    headline: String(formData.get("headline") ?? ""),
    location: cities[0] ?? "",
    years_of_experience: Number(formData.get("years_of_experience") || 0),
    student_status: formData.get("student_status") === "on",
    onboarding_completed_at: new Date().toISOString(),
  }).eq("id", userId);

  await supabase.from("user_preferences").update({
    desired_roles: roles,
    preferred_cities: cities,
    technical_skills: skills,
    employment_types: types,
    relocation_ok: formData.get("relocation_ok") === "on",
    remote_preference: workStyles,
  }).eq("user_id", userId);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  await supabase.from("profiles").update({
    full_name: String(formData.get("full_name") ?? ""),
    headline: String(formData.get("headline") ?? ""),
    location: String(formData.get("location") ?? ""),
    years_of_experience: Number(formData.get("years_of_experience") || 0),
    current_education: String(formData.get("current_education") ?? ""),
    student_status: formData.get("student_status") === "on",
    visa_sponsorship_needed: formData.get("visa_sponsorship_needed") === "on",
  }).eq("id", userId);
  await supabase.from("user_preferences").update({
    desired_roles: String(formData.get("desired_roles") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    technical_skills: String(formData.get("technical_skills") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    preferred_cities: String(formData.get("preferred_cities") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    excluded_companies: String(formData.get("excluded_companies") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    excluded_keywords: String(formData.get("excluded_keywords") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    preferred_keywords: String(formData.get("preferred_keywords") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    employment_types: formData.getAll("employment_types").map(String),
    german_states: formData.getAll("german_states").map(String),
    remote_preference: formData.getAll("remote_preference").map(String),
    relocation_ok: formData.get("relocation_ok") === "on",
    min_match_score: Number(formData.get("min_match_score") || 0),
  }).eq("user_id", userId);
  revalidatePath("/profile");
}
