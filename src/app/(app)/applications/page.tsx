import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { ApplicationsBoard } from "@/components/applications/board";
import { APPLICATION_STATUSES } from "@/lib/core/types";
import { companyName } from "@/lib/relations";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const { data } = await supabase
    .from("applications")
    .select("*, jobs(title, companies(name), apply_url, source_url)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Applications" description="Pipeline and table of everything you are tracking." />
      {(data ?? []).length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Open a job and click Apply — it opens the employer site and lists the role here under Applied."
        />
      ) : (
        <ApplicationsBoard
          applications={(data ?? []).map((a) => {
            const job = Array.isArray(a.jobs) ? a.jobs[0] : a.jobs;
            return {
              id: a.id,
              status: a.status,
              notes: a.notes ?? "",
              nextAction: a.next_action ?? "",
              appliedAt: a.applied_at,
              title: job?.title ?? "Role",
              company: companyName(job?.companies),
              url: job?.apply_url ?? job?.source_url ?? "#",
            };
          })}
          statuses={[...APPLICATION_STATUSES]}
        />
      )}
    </div>
  );
}
