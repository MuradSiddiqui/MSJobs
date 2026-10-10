"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequestChangesCard } from "./editor";
import { CvDocument } from "./cv-document";
import { VersionsCard } from "./versions-card";
import { OriginalFile } from "./original-file";
import { DownloadCvButton } from "./download-button";
import { retryResumeParseAction } from "@/server/cv";
import { cn } from "@/lib/utils";

export type CvVersion = {
  id: string;
  file_name: string;
  mime_type: string;
  byte_size: number;
  parse_status: string;
  parse_error: string | null;
  parsed: Record<string, unknown> | null;
  user_edited: Record<string, unknown> | null;
  created_at: string;
};

type Tab = "preview" | "original";

function RetryParseButton({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setError(null);
    try {
      await retryResumeParseAction(versionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Retry failed. Try again.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void retry()}
        className="rounded-lg bg-danger px-4 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
      >
        {busy ? "Retrying..." : "Try parsing again"}
      </button>
      {error ? <p className="mt-2 text-[13px]">{error}</p> : null}
    </div>
  );
}

export function CvStudio({ versions }: { versions: CvVersion[] }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(versions[0]?.id);
  const [tab, setTab] = useState<Tab>("preview");

  const selected = versions.find((v) => v.id === selectedId) ?? versions[0];
  const versionNumber = [...versions].reverse().findIndex((v) => v.id === selected?.id) + 1;
  const data = (selected?.user_edited ?? selected?.parsed) as Record<string, unknown> | null;
  const hasData = selected?.parse_status === "succeeded" && data;

  function select(id: string) {
    setSelectedId(id);
    setTab("preview");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            Preview <span className="font-normal text-muted-foreground">· v{versionNumber}</span>
          </p>
          <div
            role="tablist"
            aria-label="CV view"
            className="flex rounded-lg border border-border bg-card p-0.5 text-[13px]"
          >
            {(["preview", "original"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  tab === t
                    ? "bg-accent text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "preview" ? "Preview" : "Original file"}
              </button>
            ))}
          </div>
        </div>

        {tab === "preview" ? (
          hasData ? (
            <CvDocument data={data} />
          ) : selected?.parse_status === "failed" ? (
            <div className="rounded-xl border border-danger/25 bg-danger/5 p-6 text-sm text-danger">
              <p className="font-medium">CV parsing failed</p>
              {selected.parse_error ? (
                <p className="mt-1 text-[13px]">{selected.parse_error}</p>
              ) : null}
              <p className="mt-2 text-[13px]">
                Upload the file again, or try a PDF or DOCX instead.
              </p>
              <RetryParseButton versionId={selected.id} />
            </div>
          ) : (
            <div
              className="flex h-64 items-center justify-center rounded-xl border border-border bg-card"
              aria-busy="true"
            >
              <p className="text-sm text-muted-foreground">Extracting your CV...</p>
            </div>
          )
        ) : selected ? (
          <OriginalFile
            key={selected.id}
            versionId={selected.id}
            mimeType={selected.mime_type}
            fileName={selected.file_name}
          />
        ) : null}
      </div>

      <div className="space-y-5">
        {selected ? (
          <RequestChangesCard versionId={selected.id} disabled={!hasData} />
        ) : null}
        <VersionsCard versions={versions} selectedId={selected?.id} onSelect={select} />
        {selected ? (
          <DownloadCvButton versionId={selected.id} fileName={selected.file_name} />
        ) : null}
      </div>
    </div>
  );
}
