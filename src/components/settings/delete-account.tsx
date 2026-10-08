"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteAccountAction } from "@/server/account";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteAccountAction();
    if (!result.ok) {
      setError(result.error ?? "Could not delete your account.");
      setBusy(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <Card className="border-danger/40 p-4">
      <h2 className="text-sm font-semibold text-danger">Danger zone</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete your account and everything in it: profile, CVs,
        saved jobs, applications and match scores. This cannot be undone.
      </p>
      {!confirming ? (
        <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirming(true)}>
          Delete my account
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>
              I understand this permanently deletes my account and all of my
              data, and that I will have to sign up and be approved again to
              return.
            </span>
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={!acknowledged || busy}
              onClick={handleDelete}
            >
              {busy ? "Deleting…" : "Yes, delete everything"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setAcknowledged(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
