import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, requireSecret } from "@/lib/env";

export function getAdminClient() {
  return createClient(env().NEXT_PUBLIC_SUPABASE_URL, requireSecret("SUPABASE_SECRET_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const createAdminClient = getAdminClient;

export type AdminClient = ReturnType<typeof getAdminClient>;
