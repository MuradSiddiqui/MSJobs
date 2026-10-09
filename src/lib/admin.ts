import { env } from "@/lib/env";

/**
 * Optional safety-net admin email, read from the ADMIN_EMAIL environment
 * variable. When it is not set, there is no email-based admin: admin status
 * comes solely from the profiles.is_admin flag in the database.
 */
export function getAdminEmail(): string {
  return env().ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = getAdminEmail();
  if (!email || !adminEmail) return false;
  return email.trim().toLowerCase() === adminEmail;
}
