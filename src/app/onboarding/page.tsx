import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");

  return (
    <div className="min-h-screen bg-[#F7F5EF] px-4 py-10 sm:py-14">
      <OnboardingWizard />
    </div>
  );
}
