"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { uploadAvatarAction } from "@/server/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ProfileCardProps = {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

export function ProfileCard({ fullName, email, avatarUrl }: ProfileCardProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const name = fullName?.trim() || "Your profile";
  const initial = (fullName?.trim() || email).charAt(0).toUpperCase() || "?";
  const src = preview ?? avatarUrl;

  async function handleFile(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append("file", file);
    const result = await uploadAvatarAction(form);
    setBusy(false);
    if (!result.ok) {
      setPreview(null);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-xl font-semibold text-accent">
            {src ? (
              <img src={src} alt={`${name} profile photo`} className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Upload profile photo"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-accent disabled:opacity-60"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-foreground">{name}</h2>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading..." : "Upload photo"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 5 MB.</p>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </Card>
  );
}
