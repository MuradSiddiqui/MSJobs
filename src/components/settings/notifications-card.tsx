"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "./switch";

const TOGGLES = [
  {
    id: "email-digest",
    label: "Email digest",
    description: "A summary of your job search activity and new matches.",
  },
  {
    id: "new-match-alerts",
    label: "New match alerts",
    description: "Get notified when a new job matches your profile.",
  },
  {
    id: "approval-updates",
    label: "Approval updates",
    description: "Get notified when an application is approved or needs review.",
  },
] as const;

export function NotificationsCard() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "email-digest": true,
    "new-match-alerts": true,
    "approval-updates": false,
  });

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-foreground">Notifications</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose what you want to hear about. These preferences are not saved yet.
      </p>
      <ul className="mt-4 space-y-4">
        {TOGGLES.map((toggle) => (
          <li key={toggle.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{toggle.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{toggle.description}</p>
            </div>
            <Switch
              label={toggle.label}
              checked={enabled[toggle.id] ?? false}
              onChange={(next) => setEnabled((prev) => ({ ...prev, [toggle.id]: next }))}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
