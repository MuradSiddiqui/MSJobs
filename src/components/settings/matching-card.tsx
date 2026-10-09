import { getServerEnv, isSourceEnabled } from "@/lib/env";
import { Card, Badge } from "@/components/ui/card";
import { Switch } from "./switch";

const INGEST_SOURCES = [
  { id: "greenhouse", label: "Greenhouse" },
  { id: "ashby", label: "Ashby" },
  { id: "lever", label: "Lever" },
  { id: "workable", label: "Workable" },
] as const;

export function MatchingCard() {
  const serverEnv = getServerEnv();

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-foreground">How matching works</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        AI provider and model come from your environment configuration.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">AI provider</span>
        <Badge tone="accent">{serverEnv.AI_PROVIDER}</Badge>
        <span className="ml-3 text-xs font-medium text-muted-foreground">Model</span>
        <Badge tone="accent">{serverEnv.AI_MODEL}</Badge>
      </div>
      <div className="mt-5 border-t border-border/60 pt-4">
        <h3 className="text-sm font-medium text-foreground">Ingestion sources</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Display only. Sources are controlled by INGEST_* environment flags.
        </p>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {INGEST_SOURCES.map((source) => (
            <li key={source.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{source.label}</span>
              <Switch checked={isSourceEnabled(source.id)} disabled label={`${source.label} ingestion`} />
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
