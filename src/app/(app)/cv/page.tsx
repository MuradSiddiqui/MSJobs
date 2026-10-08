import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadResume } from "@/server/cv";
import { CvEditor } from "@/components/cv/editor";

export default async function CvPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string;
  const { data: versions } = await supabase
    .from("resume_versions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const latest = versions?.[0];

  return (
    <div>
      <PageHeader
        title="CV"
        description="Versions are kept. Corrections never get overwritten by a re-parse."
      />
      <Card className="mb-4 p-4 text-sm">
        <p className="font-medium">CV template sample</p>
        <p className="mt-1 text-muted-foreground">
          Tailored job CVs use the same classic 2-page layout as this sample (centered header, section
          rules, date columns — Google Docs style).
        </p>
        <a
          href="/samples/stelle-cv-sample.pdf"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
        >
          View sample CV PDF
        </a>
      </Card>
      <Card className="p-4">
        <form action={uploadResume} className="flex flex-wrap items-end gap-3">
          <input type="file" name="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
          <Button type="submit">Upload CV</Button>
          <p className="text-xs text-muted-foreground">PDF or DOCX, max 5 MB. Files stay private.</p>
        </form>
      </Card>
      {(versions ?? []).length === 0 ? (
        <EmptyState className="mt-4" title="No CV uploaded" description="Upload a PDF or DOCX to extract a structured profile." />
      ) : (
        <div className="mt-6 space-y-3">
          {(versions ?? []).map((v) => (
            <Card key={v.id} className="p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{v.file_name}</span>
                <span className="text-muted-foreground">{v.parse_status}</span>
              </div>
              {v.parse_error ? <p className="mt-1 text-danger">{v.parse_error}</p> : null}
            </Card>
          ))}
          {latest?.parsed ? (
            <CvEditor versionId={latest.id} parsed={(latest.user_edited ?? latest.parsed) as object} />
          ) : null}
        </div>
      )}
    </div>
  );
}
