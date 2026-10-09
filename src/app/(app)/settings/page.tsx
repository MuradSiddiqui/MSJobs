import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/states";
import { ProfileCard } from "@/components/settings/profile-card";
import { MatchingCard } from "@/components/settings/matching-card";
import { NotificationsCard } from "@/components/settings/notifications-card";
import { DeleteAccount } from "@/components/settings/delete-account";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const email = String(claims?.claims?.email ?? "");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your account, matching sources, and preferences." />
      <ProfileCard
        fullName={profile?.full_name ?? null}
        email={email}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <MatchingCard />
      <NotificationsCard />
      <DeleteAccount />
    </div>
  );
}
