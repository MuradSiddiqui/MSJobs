"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractResumeText } from "@/lib/resume/extract-text";
import { applyResumeFeedback, parseResume } from "@/lib/ai/tasks";
import type { ResumeParseResult } from "@/lib/core/schemas/ai";

const MAX = 30 * 1024 * 1024;

const ALLOWED_MIME: Record<string, "pdf" | "docx" | "png"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "png",
};

function validateUploadFile(file: unknown): asserts file is File {
  if (!(file instanceof File)) {
    throw new Error("Choose a PDF, DOCX, or PNG file.");
  }
  if (file.size > MAX) {
    throw new Error("File must be 30 MB or smaller.");
  }
  if (!ALLOWED_MIME[file.type]) {
    throw new Error("Only PDF, DOCX, and PNG are accepted.");
  }
}

async function runUpload(file: File, userId: string): Promise<void> {
  const supabase = await createClient();
  const mime = file.type;
  const ext = ALLOWED_MIME[mime];
  const versionId = crypto.randomUUID();
  const path = `${userId}/${versionId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from("resumes").upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  await supabase.from("resumes").update({ is_active: false }).eq("user_id", userId);

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .insert({ user_id: userId, title: file.name, is_active: true })
    .select("id")
    .single();
  if (resumeError || !resume) throw new Error(resumeError?.message ?? "Could not create resume");

  const { data: version, error: versionError } = await supabase
    .from("resume_versions")
    .insert({
      id: versionId,
      resume_id: resume.id,
      user_id: userId,
      storage_path: path,
      file_name: file.name,
      mime_type: mime,
      byte_size: file.size,
      parse_status: "processing",
    })
    .select("id")
    .single();
  if (versionError || !version) throw new Error(versionError?.message ?? "Could not create version");

  try {
    const text = await extractResumeText(buffer, mime);
    const parsed = await parseResume(text, userId);
    await supabase
      .from("resume_versions")
      .update({
        extracted_text: text,
        parsed,
        parse_status: "succeeded",
      })
      .eq("id", version.id);
    if (parsed.headline || parsed.name) {
      await supabase
        .from("profiles")
        .update({
          full_name: parsed.name ?? undefined,
          headline: parsed.headline ?? undefined,
        })
        .eq("id", userId);
    }
    const skills = [
      ...(parsed.skills ?? []),
      ...(parsed.programmingLanguages ?? []),
      ...(parsed.frameworks ?? []),
    ];
    if (skills.length) {
      await supabase.from("user_preferences").update({ technical_skills: skills }).eq("user_id", userId);
    }
  } catch (error) {
    await supabase
      .from("resume_versions")
      .update({
        parse_status: "failed",
        parse_error: String(error),
      })
      .eq("id", version.id);
  }
}

export async function uploadResume(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  const file = formData.get("file");
  validateUploadFile(file);
  await runUpload(file, userId);

  revalidatePath("/cv");
  redirect("/cv");
}

// Client-friendly variant: returns errors instead of throwing, no redirect.
export async function uploadResumeAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return { ok: false, error: "You are not signed in." };

  const file = formData.get("file");
  try {
    validateUploadFile(file);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
  try {
    await runUpload(file, userId);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
  revalidatePath("/cv");
  return { ok: true };
}

export async function saveResumeEdits(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");
  const id = String(formData.get("version_id"));
  const json = String(formData.get("user_edited") ?? "{}");
  await supabase
    .from("resume_versions")
    .update({ user_edited: JSON.parse(json) })
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath("/cv");
}

// Applies natural-language feedback to the latest parsed JSON of a version.
// Saves the revised JSON to user_edited on a NEW version row so each edit
// appears as its own entry in the version history.
export async function applyResumeFeedbackAction(
  versionId: string,
  feedback: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return { ok: false, error: "You are not signed in." };

  const clean = feedback.trim();
  if (!clean) return { ok: false, error: "Describe the change you want first." };
  if (clean.length > 4000) return { ok: false, error: "Keep feedback under 4000 characters." };

  const { data: version, error } = await supabase
    .from("resume_versions")
    .select(
      "id, resume_id, user_id, storage_path, file_name, mime_type, byte_size, parsed, user_edited",
    )
    .eq("id", versionId)
    .eq("user_id", userId)
    .single();
  if (error || !version) return { ok: false, error: "CV version not found." };

  const base = (version.user_edited ?? version.parsed) as ResumeParseResult | null;
  if (!base) return { ok: false, error: "This CV has no parsed data yet." };

  try {
    const revised = await applyResumeFeedback({ resume: base, feedback: clean, userId });
    const { error: insertError } = await supabase.from("resume_versions").insert({
      resume_id: version.resume_id,
      user_id: userId,
      storage_path: version.storage_path,
      file_name: version.file_name,
      mime_type: version.mime_type,
      byte_size: version.byte_size,
      parsed: base,
      user_edited: revised,
      parse_status: "succeeded",
    });
    if (insertError) throw new Error(insertError.message);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not apply the feedback.",
    };
  }

  revalidatePath("/cv");
  return { ok: true };
}

// Signed URL for previewing or downloading the original uploaded file.
export async function getResumeFileUrl(
  versionId: string,
): Promise<{ ok: boolean; url?: string; fileName?: string; error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return { ok: false, error: "You are not signed in." };

  const { data: version, error } = await supabase
    .from("resume_versions")
    .select("storage_path, file_name")
    .eq("id", versionId)
    .eq("user_id", userId)
    .single();
  if (error || !version) return { ok: false, error: "File not found." };

  const { data: signed, error: signError } = await supabase.storage
    .from("resumes")
    .createSignedUrl(version.storage_path, 300);
  if (signError || !signed) return { ok: false, error: "Could not prepare the file." };

  return { ok: true, url: signed.signedUrl, fileName: version.file_name };
}

/**
 * Re-runs text extraction + AI parsing for a resume version that failed,
 * using the original file already in storage. No re-upload needed.
 */
export async function retryResumeParseAction(versionId: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  const { data: version } = await supabase
    .from("resume_versions")
    .select("id, storage_path, mime_type, file_name, byte_size")
    .eq("id", versionId)
    .eq("user_id", userId)
    .single();
  if (!version) throw new Error("CV version not found.");

  const { data: file, error: downloadError } = await supabase.storage
    .from("resumes")
    .download(version.storage_path);
  if (downloadError || !file) {
    throw new Error("Could not download the original file. Try uploading again.");
  }

  await supabase
    .from("resume_versions")
    .update({ parse_status: "processing", parse_error: null })
    .eq("id", version.id);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractResumeText(buffer, version.mime_type);
    if (!text || text.length < 20) {
      throw new Error("No readable text found in the file. A scanned image or empty file cannot be parsed.");
    }
    const parsed = await parseResume(text, userId);
    await supabase
      .from("resume_versions")
      .update({ extracted_text: text, parsed, parse_status: "succeeded", parse_error: null })
      .eq("id", version.id);
  } catch (error) {
    await supabase
      .from("resume_versions")
      .update({ parse_status: "failed", parse_error: String(error) })
      .eq("id", version.id);
  }

  revalidatePath("/cv");
}

/**
 * Deletes one CV version (file from storage + table row) after verifying the
 * session user owns it. Deleting every version leaves the resume without a
 * usable CV, which the Jobs page treats as "no CV uploaded".
 */
export async function deleteResumeVersionAction(
  versionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return { ok: false, error: "You are not signed in." };

  const { data: version } = await supabase
    .from("resume_versions")
    .select("id, storage_path")
    .eq("id", versionId)
    .eq("user_id", userId)
    .single();
  if (!version) return { ok: false, error: "Version not found." };

  if (version.storage_path) {
    await supabase.storage.from("resumes").remove([version.storage_path]);
  }
  const { error: deleteError } = await supabase
    .from("resume_versions")
    .delete()
    .eq("id", version.id)
    .eq("user_id", userId);
  if (deleteError) return { ok: false, error: deleteError.message };

  revalidatePath("/cv");
  return { ok: true };
}
