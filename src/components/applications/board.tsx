"use client";

import { updateApplicationStatus, saveApplicationNotes } from "@/server/jobs";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type AppRow = {
  id: string;
  status: string;
  notes: string;
  nextAction: string;
  appliedAt: string | null;
  title: string;
  company: string;
  url: string;
};

export function ApplicationsBoard({
  applications,
  statuses,
}: {
  applications: AppRow[];
  statuses: string[];
}) {
  const [view, setView] = useState<"board" | "table">("board");

  if (view === "table") {
    return (
      <div>
        <ViewToggle view={view} setView={setView} />
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-t">
                  <td className="px-3 py-2">{app.title}</td>
                  <td className="px-3 py-2">{app.company}</td>
                  <td className="px-3 py-2">
                    <StatusSelect id={app.id} value={app.status} statuses={statuses} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ViewToggle view={view} setView={setView} />
      <div className="flex gap-3 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const col = applications.filter((a) => a.status === status);
          return (
            <section key={status} className="w-64 shrink-0 rounded-md border bg-card p-2">
              <h2 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {status.replaceAll("_", " ")}
                <Badge>{col.length}</Badge>
              </h2>
              <div className="space-y-2">
                {col.map((app) => (
                  <article key={app.id} className="rounded border bg-background p-2 text-sm">
                    <p className="font-medium">{app.title}</p>
                    <p className="text-xs text-muted-foreground">{app.company}</p>
                    <StatusSelect id={app.id} value={app.status} statuses={statuses} />
                    <NotesForm id={app.id} notes={app.notes} nextAction={app.nextAction} />
                    <a href={app.url} className="mt-1 inline-block text-xs text-accent" target="_blank" rel="noreferrer">
                      Original posting
                    </a>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  setView,
}: {
  view: "board" | "table";
  setView: (v: "board" | "table") => void;
}) {
  return (
    <div className="mb-3 flex gap-2">
      <Button size="sm" variant={view === "board" ? "default" : "outline"} onClick={() => setView("board")}>
        Pipeline
      </Button>
      <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>
        Table
      </Button>
    </div>
  );
}

function StatusSelect({
  id,
  value,
  statuses,
}: {
  id: string;
  value: string;
  statuses: string[];
}) {
  return (
    <select
      className="mt-1 h-8 w-full rounded border bg-card text-xs"
      defaultValue={value}
      onChange={(e) => void updateApplicationStatus(id, e.target.value)}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}

function NotesForm({ id, notes, nextAction }: { id: string; notes: string; nextAction: string }) {
  return (
    <form
      className="mt-2 space-y-1"
      action={(fd) => saveApplicationNotes(id, String(fd.get("notes")), String(fd.get("next")))}
    >
      <textarea name="notes" defaultValue={notes} placeholder="Notes" className="h-16 w-full rounded border px-2 text-xs" />
      <input name="next" defaultValue={nextAction} placeholder="Next action" className="h-7 w-full rounded border px-2 text-xs" />
      <button type="submit" className="text-xs text-accent">
        Save notes
      </button>
    </form>
  );
}
