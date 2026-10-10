"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard, AuthDivider } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signInAction } from "@/server/auth";

function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await signInAction(formData);
      return result ?? undefined;
    },
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue your matchmaking."
      footer={
        <>
          <AuthDivider />
          <p className="text-center text-sm">
            <span className="text-muted-foreground">New to MS Jobs?</span>{" "}
            <Link href="/signup" className="font-semibold text-accent hover:underline">
              Create account
            </Link>
          </p>
          <p className="text-center text-[11px] text-muted-foreground">
            Admins land on the admin portal.
          </p>
        </>
      }
    >
      <form action={action} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-[13px] font-medium text-accent hover:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-11 rounded-[10px] border-border bg-card"
          />
        </div>
        <input type="hidden" name="next" value={params.get("next") ?? "/dashboard"} />
        {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        <Button className="w-full" size="lg" type="submit">
          Log in
        </Button>
        <p className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-accent hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
