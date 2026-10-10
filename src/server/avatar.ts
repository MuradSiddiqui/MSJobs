"use server";

import { createClient, getAuthUserId } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type AvatarUploadResult =
  | { ok: true; avatarUrl: string }
  | { ok: false; error: string };

/**
 * Uploads a profile photo to the public `avatars` bucket at
 * `{userId}/avatar.{ext}` (upsert) and stores the public URL on
 * `profiles.avatar_url`. The user id always comes from the session, never
 * from client input.
 */
export async function uploadAvatarAction(formData: FormData): Promise<AvatarUploadResult> {
  try {
    return await uploadAvatarInner(formData);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed. Try again." };
  }
}

async function uploadAvatarInner(formData: FormData): Promise<AvatarUploadResult> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file to upload." };
  }

  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    return { ok: false, error: "Only JPEG, PNG, or WebP images are accepted." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = await createClient();

  // Use a unique filename per upload so browsers never serve a cached old
  // photo, then remove any previous avatar files for this user.
  const uniquePath = `${userId}/avatar-${Date.now()}.${ext}`;
  const { data: existing } = await supabase.storage.from("avatars").list(userId);
  const oldPaths = (existing ?? [])
    .map((o) => `${userId}/${o.name}`)
    .filter((p) => p !== uniquePath);

  const { error: uploadError } = await supabase.storage.from("avatars").upload(uniquePath, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  if (oldPaths.length > 0) {
    await supabase.storage.from("avatars").remove(oldPaths);
  }

  const avatarUrl = `${env().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${uniquePath}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, avatarUrl };
}

/**
 * Removes the profile photo: deletes every avatar object for the user from
 * the `avatars` bucket and clears `profiles.avatar_url`.
 */
export async function deleteAvatarAction(): Promise<AvatarUploadResult> {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return { ok: false, error: "Not signed in." };
    }
    const supabase = await createClient();

    const { data: objects } = await supabase.storage.from("avatars").list(userId);
    const paths = (objects ?? []).map((o) => `${userId}/${o.name}`);
    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from("avatars").remove(paths);
      if (removeError) {
        return { ok: false, error: removeError.message };
      }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);
    if (updateError) {
      return { ok: false, error: updateError.message };
    }
    return { ok: true, avatarUrl: "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not remove the photo." };
  }
}
