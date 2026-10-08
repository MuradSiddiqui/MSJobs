"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.APP_URL ?? "http://localhost:3000"}/auth/confirm`,
    },
  });
  if (error) return { error: error.message };
  // Email confirmation is off, so the user is signed in immediately.
  // The middleware sends unapproved users to /pending.
  redirect("/dashboard");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  // Admins land straight on the admin portal, everyone else in the app.
  // The admin flag is read with the service role so this does not depend on
  // cookie timing right after sign-in.
  let admin = isAdminEmail(signInData.user?.email);
  if (!admin && signInData.user) {
    const service = getAdminClient();
    const { data: profile } = await service
      .from("profiles")
      .select("is_admin")
      .eq("id", signInData.user.id)
      .maybeSingle();
    admin = profile?.is_admin === true;
  }
  if (admin) redirect("/admin/users" as Route);
  redirect((next.startsWith("/") ? next : "/dashboard") as Route);
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password`,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}
