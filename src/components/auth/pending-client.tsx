"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PendingClient() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold">Account pending approval</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account was created successfully. The site owner reviews every
          new account by hand, and you will get full access as soon as yours
          is approved.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Already approved? Check again to continue.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Check again
          </Button>
          <Button variant="ghost" onClick={signOut} disabled={signingOut}>
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
