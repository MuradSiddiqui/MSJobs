import type { AdminClient } from "@/lib/supabase/admin";

export async function acquireLock(
  admin: AdminClient,
  key: string,
  ttlMs: number,
  holder: string,
): Promise<boolean> {
  const until = new Date(Date.now() + ttlMs).toISOString();
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await admin
    .from("ingestion_locks")
    .update({ locked_until: until, holder })
    .eq("name", key)
    .lt("locked_until", now)
    .select("name")
    .maybeSingle();

  if (updateError) throw updateError;
  if (updated) return true;

  const { error: insertError } = await admin.from("ingestion_locks").insert({
    name: key,
    locked_until: until,
    holder,
  });

  if (!insertError) return true;
  if (insertError.code === "23505") return false;
  throw insertError;
}

export async function releaseLock(admin: AdminClient, key: string, holder: string): Promise<void> {
  const { error } = await admin.from("ingestion_locks").delete().eq("name", key).eq("holder", holder);
  if (error) throw error;
}
