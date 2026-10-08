import { env } from "@/lib/env";

/**
 * The one account that can approve other users. Set ADMIN_EMAIL in the
 * environment; falls back to the owner's login email so the gate never
 * locks everyone out by accident.
 */
export function getAdminEmail(): string {
  const fromEnv = env().ADMIN_EMAIL?.trim().toLowerCase();
  return fromEnv && fromEnv.length > 0 ? fromEnv : "muradsiddiqui99@gmail.com";
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getAdminEmail();
}
