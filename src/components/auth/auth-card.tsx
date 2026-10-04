import type { ReactNode } from "react";
import Link from "next/link";

export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.72 0.06 195 / 0.2), transparent)",
        }}
      />
      <Link href="/" className="mb-10 text-center">
        <span className="font-display text-2xl font-semibold tracking-tight">Stelle</span>
      </Link>
      <div className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-[0_1px_2px_oklch(0.22_0.02_255/0.04)] sm:p-8">
        <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-5">{children}</div>
        {footer ? <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p> : null}
      </div>
    </div>
  );
}
