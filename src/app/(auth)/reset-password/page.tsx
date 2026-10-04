"use client";

import { useActionState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updatePasswordAction } from "@/server/auth";

export default function ResetPasswordPage() {
  const [state, action] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await updatePasswordAction(formData);
      return result ?? undefined;
    },
    undefined,
  );

  return (
    <AuthCard title="Choose a new password">
      <form action={action} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        <Button className="w-full" type="submit">
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
