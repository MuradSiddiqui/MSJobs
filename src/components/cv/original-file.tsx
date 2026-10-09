"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getResumeFileUrl } from "@/server/cv";
import { Button } from "@/components/ui/button";

export function OriginalFile({
  versionId,
  mimeType,
  fileName,
}: {
  versionId: string;
  mimeType: string;
  fileName: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getResumeFileUrl(versionId).then((result) => {
      if (!live) return;
      if (result.ok && result.url) {
        setUrl(result.url);
      } else {
        setError(result.error ?? "Could not load the file.");
      }
    });
    return () => {
      live = false;
    };
  }, [versionId]);

  if (error) {
    return (
      <div className="rounded-xl border border-[#e4e0d3] bg-white p-8 text-center text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!url) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-xl border border-[#e4e0d3] bg-white"
        aria-busy="true"
      >
        <p className="text-sm text-[#667085]">Loading original file...</p>
      </div>
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <iframe
        src={url}
        title={`Original file: ${fileName}`}
        className="h-[880px] w-full rounded-xl border border-[#e4e0d3] bg-white"
      />
    );
  }

  if (mimeType === "image/png") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Original file: ${fileName}`}
        className="w-full rounded-xl border border-[#e4e0d3] bg-white"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[#e4e0d3] bg-white p-10 text-center">
      <FileText className="size-10 text-[#0e7490]" aria-hidden />
      <p className="text-sm font-medium text-[#1e2a3a]">Preview not available for Word files</p>
      <p className="text-xs text-[#667085]">Download the file to view it.</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => window.open(url, "_blank", "noreferrer")}
      >
        Open {fileName}
      </Button>
    </div>
  );
}
