"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { explainMatch, generateCoverLetter, suggestResumeImprovements } from "@/lib/ai/tasks";
import { companyName } from "@/lib/relations";
import { applySuggestionsToResume, type CvSuggestionsPayload } from "@/lib/resume/apply-suggestions";
import { renderResumePdf } from "@/lib/resume/render-pdf";
import { ResumeParseSchema } from "@/lib/core/schemas/ai";

async function uid() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

export async function saveJob(jobId: string) {
  const { supabase, userId } = await uid();
  await supabase.from("saved_jobs").upsert({ user_id: userId, job_id: jobId });
  await supabase.from("ignored_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
  revalidatePath("/jobs");
}

export async function unsaveJob(jobId: string) {
  const { supabase, userId } = await uid();
  await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
  revalidatePath("/saved");
}

export async function ignoreJob(jobId: string, reason?: string) {
  const { supabase, userId } = await uid();
  await supabase.from("ignored_jobs").upsert({ user_id: userId, job_id: jobId, reason: reason ?? null });
  await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
  revalidatePath("/jobs");
}

export async function restoreIgnored(jobId: string) {
  const { supabase, userId } = await uid();
  await supabase.from("ignored_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
  revalidatePath("/jobs");
}

export async function markOpenedApply(jobId: string) {
  const { supabase, userId } = await uid();
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("applications")
      .update({ opened_apply_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("applications").insert({
      user_id: userId,
      job_id: jobId,
      status: "interested",
      opened_apply_at: new Date().toISOString(),
    });
  }
  revalidatePath("/applications");
}

/** Track as applied; the client opens the employer apply URL in a new tab. */
export async function applyAndTrack(jobId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await markApplied(jobId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not track application" };
  }
}

export async function markApplied(jobId: string) {
  const { supabase, userId } = await uid();
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();
  const now = new Date().toISOString();
  let applicationId = existing?.id as string | undefined;
  if (applicationId) {
    await supabase
      .from("applications")
      .update({ status: "applied", applied_at: now, opened_apply_at: now })
      .eq("id", applicationId);
  } else {
    const { data } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        job_id: jobId,
        status: "applied",
        applied_at: now,
        opened_apply_at: now,
      })
      .select("id")
      .single();
    applicationId = data?.id;
  }
  if (applicationId) {
    await supabase.from("application_status_history").insert({
      application_id: applicationId,
      status: "applied",
    });
  }
  revalidatePath("/applications");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const { supabase, userId } = await uid();
  await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", userId);
  await supabase.from("application_status_history").insert({
    application_id: applicationId,
    status,
  });
  revalidatePath("/applications");
}

export async function saveApplicationNotes(applicationId: string, notes: string, nextAction: string) {
  const { supabase, userId } = await uid();
  await supabase
    .from("applications")
    .update({ notes, next_action: nextAction })
    .eq("id", applicationId)
    .eq("user_id", userId);
  revalidatePath("/applications");
}

export async function requestCoverLetter(
  jobId: string,
  language: "en" | "de",
  tone: string,
  length: "short" | "standard" | "long" = "standard",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, userId } = await uid();
  const { data: version } = await supabase
    .from("resume_versions")
    .select("parsed, user_edited")
    .eq("user_id", userId)
    .eq("parse_status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!version) {
    return { ok: false, error: "Upload and parse a CV first (CV page)." };
  }
  const { data: job } = await supabase
    .from("jobs")
    .select("*, companies(name)")
    .eq("id", jobId)
    .single();
  if (!job) return { ok: false, error: "Job not found." };
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, error: "GROQ_API_KEY is missing in .env.local." };
  }
  try {
    const letter = await generateCoverLetter({
      resume: version.user_edited ?? version.parsed,
      jobTitle: job.title,
      company: companyName(job.companies),
      jobText: job.description_text ?? "",
      language,
      tone,
      length,
      userId,
    });
    await supabase.from("generated_documents").insert({
      user_id: userId,
      job_id: jobId,
      kind: "cover_letter",
      language,
      variant: `${tone}/${length}`,
      content: letter,
    });
    revalidatePath(`/jobs/${jobId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cover letter generation failed.",
    };
  }
}

export async function requestExplanation(jobId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, userId } = await uid();
  const { data: match } = await supabase
    .from("user_job_matches")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();
  const { data: job } = await supabase
    .from("jobs")
    .select("title, companies(name)")
    .eq("id", jobId)
    .single();
  if (!match || !job) return { ok: false, error: "No match score yet — open Jobs once to score this role." };
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, error: "GROQ_API_KEY is missing in .env.local." };
  }
  try {
    const explanation = await explainMatch({
      score: match.overall_score,
      breakdown: match.breakdown,
      matched: match.matched_skills ?? [],
      missing: match.missing_skills ?? [],
      title: job.title,
      company: companyName(job.companies),
      userId,
    });
    await supabase.from("user_job_matches").update({ explanation }).eq("id", match.id);
    revalidatePath(`/jobs/${jobId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Explanation failed." };
  }
}

export async function requestCvSuggestions(jobId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, userId } = await uid();
  const { data: version } = await supabase
    .from("resume_versions")
    .select("parsed, user_edited")
    .eq("user_id", userId)
    .eq("parse_status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  const { data: match } = await supabase
    .from("user_job_matches")
    .select("missing_skills")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (!version) return { ok: false, error: "Upload and parse a CV first." };
  if (!job) return { ok: false, error: "Job not found." };
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, error: "GROQ_API_KEY is missing in .env.local." };
  }
  try {
    const suggestions = await suggestResumeImprovements({
      resume: version.user_edited ?? version.parsed,
      jobTitle: job.title,
      jobText: job.description_text ?? "",
      missing: match?.missing_skills ?? [],
      userId,
    });
    await supabase.from("generated_documents").insert({
      user_id: userId,
      job_id: jobId,
      kind: "cv_suggestions",
      content: suggestions,
    });
    revalidatePath(`/jobs/${jobId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "CV suggestions failed." };
  }
}

export async function buildTailoredCvPdf(
  jobId: string,
  suggestionsDocId: string,
): Promise<{ ok: true; docId: string; viewUrl: string; downloadUrl: string } | { ok: false; error: string }> {
  const { supabase, userId } = await uid();

  const { data: suggestionsDoc } = await supabase
    .from("generated_documents")
    .select("id, content, kind")
    .eq("id", suggestionsDocId)
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (!suggestionsDoc || suggestionsDoc.kind !== "cv_suggestions") {
    return { ok: false, error: "CV suggestions not found." };
  }

  const { data: version } = await supabase
    .from("resume_versions")
    .select("parsed, user_edited")
    .eq("user_id", userId)
    .eq("parse_status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!version) return { ok: false, error: "Upload and parse a CV first." };

  const { data: job } = await supabase
    .from("jobs")
    .select("title, companies(name)")
    .eq("id", jobId)
    .single();
  if (!job) return { ok: false, error: "Job not found." };

  const { data: claims } = await supabase.auth.getClaims();
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : null;

  const parsedResume = ResumeParseSchema.safeParse(version.user_edited ?? version.parsed);
  if (!parsedResume.success) {
    return {
      ok: false,
      error: "Could not read your structured CV. Re-upload or edit it on the CV page.",
    };
  }

  const suggestions = (suggestionsDoc.content ?? {}) as CvSuggestionsPayload;
  const tailored = applySuggestionsToResume(parsedResume.data, suggestions);
  const pdf = await renderResumePdf(tailored, {
    jobTitle: job.title,
    company: companyName(job.companies),
    contact: { email },
  });

  const fileId = crypto.randomUUID();
  const storagePath = `${userId}/variants/${jobId}/${fileId}.pdf`;
  const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, pdf, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: signed } = await supabase.storage.from("resumes").createSignedUrl(storagePath, 60 * 60);
  if (!signed?.signedUrl) return { ok: false, error: "Could not create download link." };

  const safeTitle = job.title.replace(/[^\w\-]+/g, "-").slice(0, 48);
  const { data: inserted, error: insertError } = await supabase
    .from("generated_documents")
    .insert({
      user_id: userId,
      job_id: jobId,
      kind: "cv_variant",
      variant: "suggestions-applied",
      content: {
        storagePath,
        fileName: `CV-${safeTitle}.pdf`,
        appliedFromSuggestionsId: suggestionsDocId,
        rewriteCount: suggestions.rewrites?.length ?? 0,
        note: "Clean tailored PDF. Master uploaded CV was not modified.",
      },
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? "Could not save CV variant." };
  }

  revalidatePath(`/jobs/${jobId}`);
  return {
    ok: true,
    docId: inserted.id,
    viewUrl: signed.signedUrl,
    downloadUrl: signed.signedUrl,
  };
}

export async function getCvVariantSignedUrl(
  docId: string,
): Promise<{ ok: true; url: string; fileName: string } | { ok: false; error: string }> {
  const { supabase, userId } = await uid();
  const { data: doc } = await supabase
    .from("generated_documents")
    .select("content, kind")
    .eq("id", docId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!doc || doc.kind !== "cv_variant") return { ok: false, error: "CV variant not found." };
  const content = doc.content as { storagePath?: string; fileName?: string } | null;
  if (!content?.storagePath) return { ok: false, error: "Missing storage path." };
  const { data: signed, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(content.storagePath, 60 * 60);
  if (error || !signed?.signedUrl) return { ok: false, error: error?.message ?? "Could not sign URL." };
  return { ok: true, url: signed.signedUrl, fileName: content.fileName ?? "tailored-cv.pdf" };
}
