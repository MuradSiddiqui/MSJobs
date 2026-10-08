"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getAuthUserId } from "@/lib/supabase/server";
import { getAdminCheck } from "@/server/admin";

/**
 * Lets a signed-in user permanently delete their own account and all of
 * their data. The user id always comes from the session, never from client
 * input, so nobody can delete anyone else's account. Admin accounts are
 * protected from self-deletion here to avoid accidental lockout.
 */
export async function deleteAccountAction(): Promise<{ ok: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }
  const check = await getAdminCheck();
  if (check.isAdmin) {
    return {
      ok: false,
      error: "Admin accounts cannot be deleted here. Remove admin access first.",
    };
  }
  const admin = getAdminClient();
  // Deleting the auth user cascades to the profile and all user data.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return { ok: false, error: error.message };
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: true };
}
