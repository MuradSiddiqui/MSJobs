import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { PendingClient } from "@/components/auth/pending-client";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) redirect("/login");

  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (isAdminEmail(email)) redirect("/admin/users");

  // Re-checked on every visit/refresh: as soon as the admin approves, the
  // user is sent into the app (the (app) layout takes un-onboarded users to
  // /onboarding from there). Nobody gets stuck on this page anymore.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.is_admin === true) redirect("/admin/users");
  if (profile?.is_approved === true) redirect("/dashboard");

  return <PendingClient />;
}
