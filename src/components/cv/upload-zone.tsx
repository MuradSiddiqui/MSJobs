"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, FileUp } from "lucide-react";
import { uploadResumeAction } from "@/server/cv";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MAX_BYTES = 30 * 1024 * 1024;

function useResumeUpload() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upload(file: File | null | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("File must be 30 MB or smaller.");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadResumeAction(formData);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Upload failed.");
      }
    });
  }

  return { upload, pending, error };
}

const FORMATS = ["PDF", "DOCX", "PNG"];

function FormatBadges() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      {FORMATS.map((f) => (
        <span
          key={f}
          className="rounded-lg border-[1.5px] border-[#155e75] bg-white px-2.5 py-1.5 text-xs font-bold tracking-[0.5px] text-[#155e75] shadow-[3px_3px_0px_0px_#1c293b]"
        >
          {f}
        </span>
      ))}
    </div>
  );
}

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { upload, pending, error } = useResumeUpload();

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload CV"
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
          upload(e.dataTransfer.files?.[0]);
        }}
        className={`flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed px-11 py-11 text-center transition-colors ${
          dragging ? "border-[#155e75] bg-[#0e7490]/5" : "border-[#0e7490] bg-white"
        }`}
      >
        <CloudUpload className="size-16 text-[#0e7490]" strokeWidth={1.25} aria-hidden />
        <p className="text-lg font-semibold text-[#1e2a3a]">
          {pending ? "Uploading your CV..." : "Drag and drop your CV here"}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <FileUp className="size-4" aria-hidden />
          Choose file
        </Button>
        <FormatBadges />
        <p className="text-xs text-[#667085]">Max 30 MB. Files stay private.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png"
          className="hidden"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyCvState() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, pending, error } = useResumeUpload();

  return (
    <Card className="flex flex-col items-center gap-4 border-dashed px-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#0e7490]/10">
        <CloudUpload className="size-8 text-[#0e7490]" strokeWidth={1.5} aria-hidden />
      </span>
      <div>
        <p className="font-display text-xl font-semibold tracking-tight text-[#1e2a3a]">
          Please upload your CV first
        </p>
        <p className="mt-1.5 text-sm text-[#667085]">
          PDF, DOCX or PNG, max 30 MB. MS Jobs extracts a structured profile and keeps every version.
        </p>
      </div>
      <Button
        type="button"
        disabled={pending}
        className="bg-[#0e7490] hover:bg-[#155e75]"
        onClick={() => inputRef.current?.click()}
      >
        <FileUp className="size-4" aria-hidden />
        {pending ? "Uploading..." : "Choose file"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png"
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
