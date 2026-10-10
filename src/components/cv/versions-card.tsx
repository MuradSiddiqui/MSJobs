"use client";

import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; number: number } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    setDeletingId(id);
    setDeleteError(null);
    const result = await deleteResumeVersionAction(id);
    setDeletingId(null);
    if (!result.ok) {
      setDeleteError(result.error ?? "Could not delete the version.");
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
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
                  ? "border-accent bg-accent/5"
                  : "border-border bg-card hover:border-accent/50",
              )}
            >
              <FileText className="size-4 shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">v{v.number}</span>
                  {v.id === latestId ? (
                    <Badge tone="accent">Current</Badge>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
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
              onClick={() => setConfirmDelete({ id: v.id, number: v.number })}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {deleteError ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {deleteError}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirmDelete !== null}
        title={confirmDelete ? `Delete v${confirmDelete.number}?` : ""}
        description="The file will be removed from storage. This cannot be undone."
        confirmLabel="Delete"
        busy={deletingId !== null}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(null)}
      />
    </Card>
  );
}
