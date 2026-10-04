"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signInAction } from "@/server/auth";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await signInAction(formData);
      return result ?? undefined;
    },
    undefined,
  );

  return (
    <AuthCard title="Log in" footer={<Link href="/signup">Need an account? Sign up</Link>}>
      <form action={action} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <input type="hidden" name="next" value={params.get("next") ?? "/dashboard"} />
        {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        <Button className="w-full" type="submit">
          Log in
        </Button>
        <p className="text-center text-xs">
          <Link href="/forgot-password" className="text-muted-foreground hover:underline">
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
