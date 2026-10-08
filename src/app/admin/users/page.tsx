import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { approveUserAction, removeUserAction } from "@/server/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PendingRow = {
  id: string;
  email: string;
  createdAt: string;
};

async function getPendingUsers(): Promise<PendingRow[]> {
  const admin = getAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, created_at")
    .eq("is_approved", false)
    .order("created_at", { ascending: false });
  if (error || !profiles) return [];

  const { data: usersData } = await admin.auth.admin.listUsers();
  const emailById = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? "unknown"]));

  return profiles.map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? "unknown",
    createdAt: p.created_at,
  }));
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (!isAdminEmail(email)) {
    redirect("/dashboard");
  }

  const pending = await getPendingUsers();

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <Card className="p-6">
        <h1 className="text-lg font-semibold">User approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New signups wait here until you approve them. Approved users get full
          access immediately; removed users lose access and their data is
          deleted.
        </p>
        {pending.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No pending approvals. Every user is approved.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {pending.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Signed up {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await approveUserAction(row.id);
                    }}
                  >
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await removeUserAction(row.id);
                    }}
                  >
                    <Button type="submit" size="sm" variant="danger">
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
