"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AuthCard, AuthDivider } from "@/components/auth/auth-card";
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
    <AuthCard
      title="Create your account"
      subtitle="Start getting matched in minutes."
      footer={
        <>
          <AuthDivider />
          <p className="text-center text-sm">
            <span className="text-muted-foreground">Already registered?</span>{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Log in
            </Link>
          </p>
        </>
      }
    >
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              required
              className="h-11 rounded-[10px] border-border bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              name="last_name"
              type="text"
              autoComplete="family-name"
              required
              className="h-11 rounded-[10px] border-border bg-card"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="h-11 rounded-[10px] border-border bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Min. 8 characters"
            required
            className="h-11 rounded-[10px] border-border bg-card"
          />
        </div>
        {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        <Button className="w-full" size="lg" type="submit">
          Create account
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Every account is reviewed by hand. No spam, ever.
        </p>
      </form>
    </AuthCard>
  );
}
