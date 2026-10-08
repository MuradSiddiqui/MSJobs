"use client";

import { Button } from "@/components/ui/button";
import {
  applyAndTrack,
  ignoreJob,
  markApplied,
  requestCoverLetter,
  requestCvSuggestions,
  requestExplanation,
  restoreIgnored,
  saveJob,
  unsaveJob,
} from "@/server/jobs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

export function JobActions({
  jobId,
  applyUrl,
  saved,
  ignored,
}: {
  jobId: string;
  applyUrl: string;
  saved: boolean;
  ignored: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "de">("en");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState<"short" | "standard" | "long">("standard");

  async function run(name: string, fn: () => Promise<{ ok: true } | { ok: false; error: string } | void>) {
    setBusy(name);
    try {
      const result = await fn();
      if (result && typeof result === "object" && "ok" in result) {
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function handleApply() {
    setBusy("apply");
    try {
      const result = await applyAndTrack(jobId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.open(applyUrl, "_blank", "noopener,noreferrer");
      toast.success("Tracked as Applied — finish the form on the employer site", {
        action: {
          label: "Applications",
          onClick: () => router.push("/applications"),
        },
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open apply page");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="max-w-xl text-xs text-muted-foreground">
        Apply opens the employer&apos;s real form (Greenhouse, Ashby, etc.) and adds this role to your
        Applications board. MS Jobs cannot auto-submit third-party forms — that would be insecure and
        against most ATS terms.
      </p>
      <div className="flex flex-wrap gap-2">
        {saved ? (
          <Button variant="outline" size="sm" onClick={() => run("unsave", () => unsaveJob(jobId))}>
            Unsave
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => run("save", () => saveJob(jobId))}>
            Save
          </Button>
        )}
        {ignored ? (
          <Button variant="outline" size="sm" onClick={() => run("restore", () => restoreIgnored(jobId))}>
            Restore
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => run("ignore", () => ignoreJob(jobId, "not relevant"))}
          >
            Ignore
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            run("explain", async () => {
              const r = await requestExplanation(jobId);
              if (r.ok) toast.success("Match explanation ready");
              return r;
            })
          }
          disabled={busy === "explain"}
        >
          {busy === "explain" ? "Explaining…" : "Explain match"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            run("cv", async () => {
              const r = await requestCvSuggestions(jobId);
              if (r.ok) toast.success("CV suggestions ready");
              return r;
            })
          }
          disabled={busy === "cv"}
        >
          {busy === "cv" ? "Working…" : "Improve CV"}
        </Button>
        <Button size="sm" onClick={() => void handleApply()} disabled={busy === "apply" || !applyUrl}>
          {busy === "apply" ? "Opening…" : "Apply"}
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            run("applied", async () => {
              await markApplied(jobId);
              toast.success("Marked as applied");
            })
          }
        >
          Already applied
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-md border bg-card p-3">
        <label className="text-xs">
          Language
          <select
            className="mt-1 block h-8 rounded border bg-background px-2 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "de")}
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </label>
        <label className="text-xs">
          Tone
          <select
            className="mt-1 block h-8 rounded border bg-background px-2 text-sm"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="formal">Formal</option>
            <option value="technical">Technical</option>
            <option value="enthusiastic">Enthusiastic</option>
          </select>
        </label>
        <label className="text-xs">
          Length
          <select
            className="mt-1 block h-8 rounded border bg-background px-2 text-sm"
            value={length}
            onChange={(e) => setLength(e.target.value as "short" | "standard" | "long")}
          >
            <option value="short">Shorter</option>
            <option value="standard">Standard</option>
            <option value="long">Longer</option>
          </select>
        </label>
        <Button
          size="sm"
          onClick={() =>
            run("letter", async () => {
              const r = await requestCoverLetter(jobId, language, tone, length);
              if (r.ok) toast.success("Cover letter ready — scroll down to copy it");
              return r;
            })
          }
          disabled={busy === "letter"}
        >
          {busy === "letter" ? "Writing…" : "Generate cover letter"}
        </Button>
      </div>
    </div>
  );
}
