"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractResumeText } from "@/lib/resume/extract-text";
import { parseResume } from "@/lib/ai/tasks";

const MAX = 5 * 1024 * 1024;

export async function uploadResume(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Choose a PDF or DOCX file.");
  }
  if (file.size > MAX) {
    throw new Error("File must be 5 MB or smaller.");
  }
  const mime = file.type;
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(mime)) {
    throw new Error("Only PDF and DOCX are accepted.");
  }

  const ext = mime.includes("pdf") ? "pdf" : "docx";
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

  revalidatePath("/cv");
  redirect("/cv");
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
