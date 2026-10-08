import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { getAdminCheck, approveUserAction, removeUserAction, setAdminAction } from "@/server/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

type UserRow = {
  id: string;
  email: string;
  createdAt: string;
};

async function getUsers(): Promise<{ pending: UserRow[]; admins: UserRow[] }> {
  const admin = getAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, created_at, is_approved, is_admin")
    .order("created_at", { ascending: false });

  const { data: usersData } = await admin.auth.admin.listUsers();
  const emailById = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? "unknown"]));

  const pending: UserRow[] = [];
  const admins: UserRow[] = [];
  for (const p of profiles ?? []) {
    const row = {
      id: p.id,
      email: emailById.get(p.id) ?? "unknown",
      createdAt: p.created_at,
    };
    if (!p.is_approved && !p.is_admin) pending.push(row);
    if (p.is_admin) admins.push(row);
  }
  return { pending, admins };
}

export default async function AdminUsersPage() {
  const check = await getAdminCheck();
  if (!check.isAdmin) {
    redirect("/dashboard");
  }

  const { pending, admins } = await getUsers();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Administrators</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Admins bypass the approval gate and can manage users. Only the
          account owner should stay here long term.
        </p>
        <ul className="mt-4 divide-y">
          {admins.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.email}</p>
                <p className="text-xs text-muted-foreground">
                  {row.id === check.userId ? "This is you" : `Since ${new Date(row.createdAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge>admin</Badge>
                {row.id !== check.userId && (
                  <form
                    action={async () => {
                      "use server";
                      await setAdminAction(row.id, false);
                    }}
                  >
                    <Button type="submit" size="sm" variant="outline">
                      Remove admin
                    </Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
