import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCachedSession } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await getCachedSession();
  if (!session) redirect("/login");

  // Admins skip onboarding entirely; it is meant for regular users.
  if (!session.isAdmin && !session.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return <AppShell email={session.email}>{children}</AppShell>;
}
