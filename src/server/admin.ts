"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (!isAdminEmail(email)) {
    throw new Error("Not authorized");
  }
}

export async function approveUserAction(userId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const admin = getAdminClient();
  const { error } = await admin.from("profiles").update({ is_approved: true }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function removeUserAction(userId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const admin = getAdminClient();
  // Deleting the auth user cascades to their profile and all their data.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
