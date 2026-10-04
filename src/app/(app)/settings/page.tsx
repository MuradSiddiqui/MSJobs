import { PageHeader } from "@/components/shared/states";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Runtime configuration is environment-based." />
      <Card className="space-y-2 p-4 text-sm">
        <p>
          AI provider and model IDs come from <code>AI_PROVIDER</code>, <code>AI_MODEL</code>, and{" "}
          <code>AI_MODEL_STRONG</code>. They are never hardcoded in tasks.
        </p>
        <p>
          Ingestion sources can be toggled with <code>INGEST_*</code> flags. Bundesagentur stays off
          until you have legal clearance.
        </p>
        <p className="text-muted-foreground">
          Google OAuth can be added later in the Supabase dashboard without a schema change.
        </p>
      </Card>
    </div>
  );
}
