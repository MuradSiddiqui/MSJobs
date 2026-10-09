import { SignOutButton } from "@/components/auth/sign-out-button";

// The admin portal is approvals-only: pending users to accept or decline,
// the administrators list, and sign out. Admins do not get the app dashboard.
export function AdminHeader({ email }: { email: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admin</p>
        <p className="truncate text-sm text-muted-foreground">{email ?? ""}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
