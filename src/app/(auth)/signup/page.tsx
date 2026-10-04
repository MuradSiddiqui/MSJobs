"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signUpAction } from "@/server/auth";

export default function SignupPage() {
  const [state, action] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await signUpAction(formData);
      return result ?? undefined;
    },
    undefined,
  );

  return (
    <AuthCard title="Create account" footer={<Link href="/login">Already registered? Log in</Link>}>
      <form action={action} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        <Button className="w-full" type="submit">
          Sign up
        </Button>
      </form>
    </AuthCard>
  );
}
