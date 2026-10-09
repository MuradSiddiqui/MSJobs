"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Trash2, Upload, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { Switch } from "@/components/settings/switch";
import {
  DOCUMENT_TYPES,
  deleteDocumentAction,
  getDocumentDownloadUrlAction,
  listDocumentsAction,
  toggleAttachAction,
  uploadDocumentAction,
  type UserDocument,
} from "@/server/documents";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg";

function formatBytes(size: number | null): string {
  if (size == null || size <= 0) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** i;
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function extOf(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() ?? "").toUpperCase().slice(0, 4) : "DOC";
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [docType, setDocType] = useState<string>("other");
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const result = await listDocumentsAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Could not load documents.");
      return;
    }
    setDocuments(result.documents);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const result = await listDocumentsAction();
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error ?? "Could not load documents.");
        return;
      }
      setDocuments(result.documents);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function handleFiles(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setError(null);
    setUploading((n) => n + list.length);
    for (const file of list) {
      const form = new FormData();
      form.append("file", file);
      form.append("doc_type", docType);
      const result = await uploadDocumentAction(form);
      if (!result.ok) {
        setError(result.error ?? `Could not upload ${file.name}.`);
      }
    }
    setUploading((n) => Math.max(0, n - list.length));
    await refresh();
  }

  async function handleToggle(doc: UserDocument) {
    const next = !doc.attach_to_applications;
    setBusyIds((prev) => ({ ...prev, [doc.id]: true }));
    const result = await toggleAttachAction(doc.id, next);
    setBusyIds((prev) => ({ ...prev, [doc.id]: false }));
    if (!result.ok) {
      setError(result.error ?? "Could not update the document.");
      return;
    }
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, attach_to_applications: next } : d)));
  }

  async function handleDownload(doc: UserDocument) {
    const result = await getDocumentDownloadUrlAction(doc.id);
    if (!result.ok || !result.url) {
      setError(result.error ?? "Could not create a download link.");
      return;
    }
    window.open(result.url, "_blank", "noopener");
  }

  async function handleDelete(doc: UserDocument) {
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    setBusyIds((prev) => ({ ...prev, [doc.id]: true }));
    const result = await deleteDocumentAction(doc.id);
    setBusyIds((prev) => ({ ...prev, [doc.id]: false }));
    if (!result.ok) {
      setError(result.error ?? "Could not delete the document.");
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Transcripts and certificates live here. Anything marked attached is included when you apply."
      />

      <Card className="p-5">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload documents"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
          )}
        >
          {uploading > 0 ? (
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {uploading > 0 ? `Uploading ${uploading} file${uploading === 1 ? "" : "s"}...` : "Drop files here or click to browse"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Max 30 MB each.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["PDF", "DOCX", "PNG", "JPG"].map((kind) => (
              <Badge key={kind}>{kind}</Badge>
            ))}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="doc-type" className="text-xs font-medium text-muted-foreground">
            Document type for new uploads
          </label>
          <select
            id="doc-type"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-8 rounded-lg border border-border/80 bg-card px-2 text-sm text-foreground"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Your documents {documents.length > 0 ? `(${documents.length})` : ""}
        </h2>
        {loading ? (
          <Card className="flex items-center justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        ) : documents.length === 0 ? (
          <Card className="p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No documents yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your transcript, certificates, or anything else you want attached to applications.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2.5">
            {documents.map((doc) => {
              const busy = busyIds[doc.id] ?? false;
              return (
                <Card key={doc.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-[11px] font-bold tracking-wide text-accent"
                  >
                    {extOf(doc.file_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{doc.file_name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatBytes(doc.byte_size)} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <Badge tone={doc.attach_to_applications ? "match" : "muted"} className="hidden shrink-0 sm:inline-flex">
                    {doc.doc_type}
                  </Badge>
                  <label className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-xs text-muted-foreground md:inline">
                      Attach to applications
                    </span>
                    <Switch
                      label={`Attach ${doc.file_name} to applications`}
                      checked={doc.attach_to_applications}
                      onChange={() => void handleToggle(doc)}
                      disabled={busy}
                    />
                  </label>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Download ${doc.file_name}`}
                      title="Download"
                      disabled={busy}
                      onClick={() => void handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${doc.file_name}`}
                      title="Delete"
                      disabled={busy}
                      onClick={() => void handleDelete(doc)}
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
