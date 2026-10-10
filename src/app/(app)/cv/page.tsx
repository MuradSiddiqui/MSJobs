import { createClient } from "@/lib/supabase/server";
import { UploadZone, EmptyCvState } from "@/components/cv/upload-zone";
import { CvStudio, type CvVersion } from "@/components/cv/studio";

export default async function CvPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const { data: versions } = await supabase
    .from("resume_versions")
    .select(
      "id, file_name, mime_type, byte_size, parse_status, parse_error, parsed, user_edited, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const list = (versions ?? []) as unknown as CvVersion[];
  const stamp = `${list.length}:${list.map((v) => v.id).join(",")}`;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[30px] font-bold tracking-tight text-foreground">
            CV Studio
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Upload once. MS Jobs keeps versions and tailors per job.
          </p>
        </div>
        <a
          href="/samples/stelle-cv-sample.pdf"
          target="_blank"
          rel="noreferrer"
          className="mt-1 text-sm font-medium text-accent hover:underline"
        >
          View sample
        </a>
      </div>

      <UploadZone />

      {list.length === 0 ? (
        <EmptyCvState />
      ) : (
        <CvStudio key={stamp} versions={list} />
      )}
    </div>
  );
}
