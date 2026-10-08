"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

export type AdminCheck = {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
};

export async function getAdminCheck(): Promise<AdminCheck> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const email = typeof claims?.email === "string" ? claims.email : null;
  if (isAdminEmail(email)) {
    return { userId, email, isAdmin: true };
  }
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.is_admin === true) {
      return { userId, email, isAdmin: true };
    }
  }
  return { userId, email, isAdmin: false };
}

async function requireAdmin(): Promise<AdminCheck> {
  const check = await getAdminCheck();
  if (!check.isAdmin) {
    throw new Error("Not authorized");
  }
  return check;
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
  const check = await requireAdmin();
  if (check.userId === userId) {
    return { ok: false, error: "You cannot remove your own account here. Use Settings instead." };
  }
  const admin = getAdminClient();
  // Deleting the auth user cascades to their profile and all their data.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setAdminAction(
  userId: string,
  makeAdmin: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const check = await requireAdmin();
  if (!makeAdmin && check.userId === userId) {
    return { ok: false, error: "You cannot remove your own admin access." };
  }
  const admin = getAdminClient();
  const { error } = await admin.from("profiles").update({ is_admin: makeAdmin }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
