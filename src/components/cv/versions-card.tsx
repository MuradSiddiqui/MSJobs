"use client";

import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { deleteResumeVersionAction } from "@/server/cv";
import type { CvVersion } from "./studio";

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VersionsCard({
  versions,
  selectedId,
  onSelect,
}: {
  versions: CvVersion[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const numbered = [...versions].reverse().map((v, i) => ({ ...v, number: i + 1 }));
  const latestId = numbered.length > 0 ? numbered[numbered.length - 1]?.id : undefined;
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, number: number) {
    if (!window.confirm(`Delete v${number}? This cannot be undone.`)) return;
    setDeletingId(id);
    const result = await deleteResumeVersionAction(id);
    setDeletingId(null);
    if (!result.ok) {
      window.alert(result.error ?? "Could not delete the version.");
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-semibold tracking-tight text-[#1e2a3a]">
        Versions
      </h2>
      <ul className="mt-3 space-y-2">
        {[...numbered].reverse().map((v) => (
          <li key={v.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(v.id)}
              className={cn(
                "flex w-full min-w-0 flex-1 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                v.id === selectedId
                  ? "border-[#0e7490] bg-[#0e7490]/5"
                  : "border-[#e4e0d3] bg-white hover:border-[#0e7490]/50",
              )}
            >
              <FileText className="size-4 shrink-0 text-[#0e7490]" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1e2a3a]">v{v.number}</span>
                  {v.id === latestId ? (
                    <Badge tone="accent">Current</Badge>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-[#667085]">
                  {formatDay(v.created_at)}
                  {v.parse_status !== "succeeded" ? ` · ${v.parse_status}` : ""}
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label={`Delete v${v.number}`}
              title={`Delete v${v.number}`}
              disabled={deletingId === v.id}
              onClick={() => void handleDelete(v.id, v.number)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#667085] transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
