"use server";

import { createClient, getAuthUserId } from "@/lib/supabase/server";

const MAX_BYTES = 30 * 1024 * 1024;
const BUCKET = "documents";

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export const DOCUMENT_TYPES = ["transcript", "certificate", "degree", "reference", "other"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type UserDocument = {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  byte_size: number | null;
  doc_type: string;
  attach_to_applications: boolean;
  created_at: string;
};

export type DocumentsResult =
  | { ok: true; documents: UserDocument[] }
  | { ok: false; error: string };

type ActionResult<T = void> = { ok: boolean; error?: string } & (T extends void
  ? object
  : { data?: T });

function sanitizeName(name: string): string {
  const base = name.split("/").pop()?.split("\\").pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_");
  return (cleaned || "file").slice(0, 120);
}

function normalizeDocType(value: unknown): DocumentType {
  return typeof value === "string" && (DOCUMENT_TYPES as readonly string[]).includes(value)
    ? (value as DocumentType)
    : "other";
}

/**
 * Uploads one document (PDF, DOCX, PNG, or JPG, max 30 MB) to the private
 * `documents` bucket at `{userId}/{timestamp}-{sanitizedName}` and records
 * it in the `user_documents` table. The user id always comes from the
 * session, never from client input.
 */
export async function uploadDocumentAction(formData: FormData): Promise<ActionResult<UserDocument>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }

  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    return { ok: false, error: "Only PDF, DOCX, PNG, or JPG files are accepted." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Each file must be 30 MB or smaller." };
  }

  const docType = normalizeDocType(formData.get("doc_type"));
  const storagePath = `${userId}/${Date.now()}-${sanitizeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data, error: insertError } = await supabase
    .from("user_documents")
    .insert({
      user_id: userId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      byte_size: file.size,
      doc_type: docType,
      attach_to_applications: true,
    })
    .select("*")
    .single();
  if (insertError || !data) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: insertError?.message ?? "Could not save the document." };
  }

  return { ok: true, data: data as UserDocument };
}

/**
 * Lists the signed-in user's documents, newest first.
 */
export async function listDocumentsAction(): Promise<DocumentsResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, documents: (data ?? []) as UserDocument[] };
}

/**
 * Deletes a document after verifying the session user owns it: removes the
 * storage object from the private bucket and deletes the table row.
 */
export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }
  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("user_documents")
    .select("id, user_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !data || data.user_id !== userId) {
    return { ok: false, error: "Document not found." };
  }

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([data.storage_path]);
  if (storageError) {
    return { ok: false, error: storageError.message };
  }

  const { error: deleteError } = await supabase.from("user_documents").delete().eq("id", id);
  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  return { ok: true };
}

/**
 * Toggles whether a document is attached to applications, after verifying
 * the session user owns the row.
 */
export async function toggleAttachAction(id: string, attach: boolean): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }
  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("user_documents")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !data || data.user_id !== userId) {
    return { ok: false, error: "Document not found." };
  }

  const { error: updateError } = await supabase
    .from("user_documents")
    .update({ attach_to_applications: attach })
    .eq("id", id);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}

/**
 * Creates a 60-second signed download URL for a document owned by the
 * session user. The documents bucket stays private; nothing is made public.
 */
export async function getDocumentDownloadUrlAction(
  id: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }
  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("user_documents")
    .select("id, user_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !data || data.user_id !== userId) {
    return { ok: false, error: "Document not found." };
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.storage_path, 60);
  if (signError || !signed) {
    return { ok: false, error: signError?.message ?? "Could not create a download link." };
  }

  return { ok: true, url: signed.signedUrl };
}
