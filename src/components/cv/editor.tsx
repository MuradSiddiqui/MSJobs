"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { applyResumeFeedbackAction } from "@/server/cv";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";

export function RequestChangesCard({
  versionId,
  disabled,
}: {
  versionId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = !disabled && !pending && feedback.trim().length > 0;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await applyResumeFeedbackAction(versionId, feedback);
      if (result.ok) {
        setFeedback("");
        router.refresh();
      } else {
        setError(result.error ?? "Could not apply the feedback.");
      }
    });
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
        Request changes
      </h2>
      <div className="mt-3 space-y-3">
        <div>
          <Label htmlFor="cv-feedback" className="sr-only">
            Describe the change
          </Label>
          <Textarea
            id="cv-feedback"
            rows={4}
            value={feedback}
            disabled={disabled || pending}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Example: Emphasize my React experience and shorten the summary."
          />
        </div>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="w-full bg-accent hover:bg-accent/90"
        >
          <Sparkles className="size-4" aria-hidden />
          {pending ? "Applying feedback..." : "Apply feedback"}
        </Button>
        {error ? (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {disabled ? (
          <p className="text-xs text-muted-foreground">
            Feedback is available once the CV has been parsed successfully.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
