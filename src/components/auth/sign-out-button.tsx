"use client";

import { signOutAction } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({
  formClassName,
  buttonClassName,
}: {
  formClassName?: string;
  buttonClassName?: string;
}) {
  return (
    <form action={signOutAction} className={formClassName}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className={cn("justify-start", buttonClassName)}
      >
        Sign out
      </Button>
    </form>
  );
}
