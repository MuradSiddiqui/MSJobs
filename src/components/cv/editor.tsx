"use client";

import { saveResumeEdits } from "@/server/cv";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useMemo, useState } from "react";

export function CvEditor({ versionId, parsed }: { versionId: string; parsed: object }) {
  const [value, setValue] = useState(() => JSON.stringify(parsed, null, 2));
  const valid = useMemo(() => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, [value]);

  return (
    <form action={saveResumeEdits} className="space-y-2">
      <input type="hidden" name="version_id" value={versionId} />
      <input type="hidden" name="user_edited" value={value} />
      <p className="text-sm font-medium">Review extracted profile</p>
      <Textarea className="min-h-96 font-mono text-xs" value={value} onChange={(e) => setValue(e.target.value)} />
      <Button type="submit" disabled={!valid}>
        Save corrections
      </Button>
      {!valid ? <p className="text-xs text-danger">JSON is invalid.</p> : null}
    </form>
  );
}
