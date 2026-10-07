"use client";

import type { ReactNode } from "react";
import type { Route } from "next";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Briefcase, Bookmark, Kanban, FileText, User, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/applications", label: "Applications", icon: Kanban },
  { href: "/cv", label: "CV", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-accent/10 font-medium text-accent"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                active ? "text-accent" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border/80 bg-sidebar/90 p-4 backdrop-blur-md md:flex md:flex-col">
        <Link href="/dashboard" className="mb-8 px-2.5">
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            MS Jobs
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">AI job search</span>
        </Link>
        {nav}
        <div className="mt-auto space-y-2 border-t border-border/60 pt-4">
          <p className="truncate px-2.5 text-xs text-muted-foreground">{email}</p>
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" className="justify-start" onClick={signOut}>
              Sign out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/80 bg-background/85 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/dashboard" className="font-display text-lg font-semibold tracking-tight">
          MS Jobs
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>
      {open ? (
        <div className="border-b border-border/80 bg-sidebar/95 p-3 backdrop-blur-md md:hidden">
          {nav}
          <div className="mt-3 border-t border-border/60 pt-3">
            <p className="truncate px-2.5 text-xs text-muted-foreground">{email}</p>
            <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      ) : null}

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-7 md:px-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
