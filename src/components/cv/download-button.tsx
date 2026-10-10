"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { getResumeFileUrl } from "@/server/cv";
import { Button } from "@/components/ui/button";

export function DownloadCvButton({
  versionId,
  fileName,
}: {
  versionId: string;
  fileName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function download() {
    setError(null);
    startTransition(async () => {
      const result = await getResumeFileUrl(versionId);
      if (result.ok && result.url) {
        const a = document.createElement("a");
        a.href = result.url;
        a.download = result.fileName ?? fileName;
        a.target = "_blank";
        a.rel = "noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        setError(result.error ?? "Could not prepare the download.");
      }
    });
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        disabled={pending}
        onClick={download}
        className="w-full bg-accent hover:bg-accent/90"
      >
        <Download className="size-4" aria-hidden />
        {pending ? "Preparing..." : "Download CV"}
      </Button>
      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Tailored application PDFs are generated per job.
      </p>
    </div>
  );
}
