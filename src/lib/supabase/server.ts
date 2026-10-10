import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { isAdminEmail } from "@/lib/admin";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env().NEXT_PUBLIC_SUPABASE_URL,
    env().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, headers) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
            void headers;
          } catch {
            // Called from a Server Component; the proxy refreshes the session.
          }
        },
      },
    },
  );
}

export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

export type CachedSession = {
  userId: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  onboardingCompletedAt: string | null;
};

/**
 * Request-scoped session resolution. React cache() dedupes this across the
 * layout and every page/server component in the same request, so the JWT is
 * verified once and the profiles row is read once instead of per component.
 * Note: middleware runs in a separate context and cannot share this cache.
 */
export const getCachedSession = cache(async (): Promise<CachedSession | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const sub = claims?.sub;
  if (typeof sub !== "string" || sub.length === 0) return null;
  const email = typeof claims?.email === "string" ? claims.email : "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, is_admin, onboarding_completed_at")
    .eq("id", sub)
    .maybeSingle();

  const isAdmin = isAdminEmail(email) || profile?.is_admin === true;
  return {
    userId: sub,
    email,
    isAdmin,
    isApproved: isAdmin || profile?.is_approved === true,
    onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
  };
});
