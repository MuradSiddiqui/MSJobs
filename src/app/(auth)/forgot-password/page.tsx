"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { resetPasswordAction } from "@/server/auth";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) =>
      resetPasswordAction(formData),
    undefined,
  );

  return (
    <AuthCard title="Reset password" footer={<Link href="/login">Back to login</Link>}>
      {state?.ok ? (
        <p className="text-sm text-muted-foreground">If that account exists, we sent a reset link.</p>
      ) : (
        <form action={action} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          <Button className="w-full" type="submit">
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
