"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Download, Eye, FileDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildTailoredCvPdf, getCvVariantSignedUrl } from "@/server/jobs";

type Doc = {
  id: string;
  kind: string;
  language: string | null;
  variant: string | null;
  content: unknown;
};

export function GeneratedDocuments({ docs, jobId }: { docs: Doc[]; jobId: string }) {
  if (docs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        None yet. Generate a cover letter or CV suggestions with the actions above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {docs.map((doc) => (
        <Card key={doc.id} className="p-4 text-sm">
          <p className="font-medium capitalize">
            {String(doc.kind).replaceAll("_", " ")}
            {doc.language ? ` · ${doc.language.toUpperCase()}` : ""}
            {doc.variant ? ` · ${doc.variant}` : ""}
          </p>
          <DocBody content={doc.content} kind={doc.kind} docId={doc.id} jobId={jobId} />
        </Card>
      ))}
    </div>
  );
}

function DocBody({
  content,
  kind,
  docId,
  jobId,
}: {
  content: unknown;
  kind: string;
  docId: string;
  jobId: string;
}) {
  if (!content || typeof content !== "object") {
    return (
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
        {String(content ?? "")}
      </pre>
    );
  }

  const data = content as Record<string, unknown>;

  if (kind === "cover_letter") {
    const subject = typeof data.subject === "string" ? data.subject : "";
    const body = typeof data.body === "string" ? data.body : JSON.stringify(data, null, 2);
    return (
      <div className="mt-3 space-y-3">
        {subject ? (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-xs">
            <span className="font-semibold text-muted-foreground">Subject: </span>
            {subject}
          </p>
        ) : null}
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-3 text-sm leading-6 text-foreground">
          {body}
        </pre>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={async () => {
            const text = subject ? `Subject: ${subject}\n\n${body}` : body;
            await navigator.clipboard.writeText(text);
            toast.success("Cover letter copied");
          }}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy letter
        </Button>
      </div>
    );
  }

  if (kind === "cv_suggestions") {
    return <CvSuggestionsBody data={data} docId={docId} jobId={jobId} />;
  }

  if (kind === "cv_variant") {
    return <CvVariantBody docId={docId} data={data} />;
  }

  return (
    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function CvSuggestionsBody({
  data,
  docId,
  jobId,
}: {
  data: Record<string, unknown>;
  docId: string;
  jobId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const rewrites = Array.isArray(data.rewrites) ? data.rewrites : [];

  async function generatePdf() {
    setBusy(true);
    try {
      const result = await buildTailoredCvPdf(jobId, docId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Tailored CV PDF ready");
      window.open(result.viewUrl, "_blank", "noopener,noreferrer");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Suggestions are diffs only until you generate a PDF. Stelle applies them into a{" "}
        <strong>new tailored CV</strong> (your uploaded master file stays unchanged) using a classic
        2-page academic layout (centered header, section rules, date columns) similar to Google Docs
        CVs. Re-upload your CV once if contact links / technical strengths are missing from an older
        parse.
      </p>
      <Button size="sm" onClick={() => void generatePdf()} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {busy ? "Building PDF…" : "Apply suggestions → PDF"}
      </Button>
      {Array.isArray(data.keywordsToInclude) && data.keywordsToInclude.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Keywords: {(data.keywordsToInclude as string[]).join(", ")}
        </p>
      ) : null}
      {rewrites.map((row, index) => {
        const rewrite = row as { original?: string; suggested?: string; reason?: string };
        return (
          <div key={index} className="grid gap-2 rounded border p-2 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Original
              </p>
              <p className="mt-1 text-xs">{rewrite.original}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested
              </p>
              <p className="mt-1 text-xs">{rewrite.suggested}</p>
            </div>
            {rewrite.reason ? (
              <p className="text-xs text-muted-foreground md:col-span-2">{rewrite.reason}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CvVariantBody({ docId, data }: { docId: string; data: Record<string, unknown> }) {
  const [busy, setBusy] = useState<"view" | "download" | null>(null);
  const note = typeof data.note === "string" ? data.note : null;
  const fileName = typeof data.fileName === "string" ? data.fileName : "tailored-cv.pdf";

  async function openSigned(mode: "view" | "download") {
    setBusy(mode);
    try {
      const result = await getCvVariantSignedUrl(docId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (mode === "view") {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = result.url;
        a.download = result.fileName || fileName;
        a.target = "_blank";
        a.rel = "noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open PDF");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      <p className="text-xs text-muted-foreground">File: {fileName}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void openSigned("view")}>
          {busy === "view" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          View PDF
        </Button>
        <Button size="sm" disabled={busy !== null} onClick={() => void openSigned("download")}>
          {busy === "download" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download PDF
        </Button>
      </div>
    </div>
  );
}
