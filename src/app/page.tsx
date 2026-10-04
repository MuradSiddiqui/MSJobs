import Link from "next/link";
import { ArrowRight, FileSearch, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Target,
    title: "Transparent scoring",
    description:
      "Every match is an eight-component, explainable score — role, skills, experience, seniority, location, language, and more. No black box.",
  },
  {
    icon: FileSearch,
    title: "Real ATS feeds",
    description:
      "Postings are pulled straight from Greenhouse, Ashby, SmartRecruiters, Personio and more — never scraped, never invented.",
  },
  {
    icon: Sparkles,
    title: "AI that assists, not lies",
    description:
      "Get a plain-language match explanation, CV improvement suggestions, and a drafted cover letter — grounded in your real CV.",
  },
  {
    icon: Zap,
    title: "Always fresh",
    description:
      "Scheduled ingestion keeps the board current, with dedupe across sources so the same posting never shows twice.",
  },
];

const STEPS = [
  { step: "01", title: "Upload your CV", description: "PDF or DOCX. We parse it into a structured profile you can correct." },
  { step: "02", title: "Set your preferences", description: "Roles, cities, remote policy, employment type — HiWi to full-time." },
  { step: "03", title: "Browse scored matches", description: "See why a job fits, save the good ones, track your applications." },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 15% 10%, oklch(0.72 0.06 195 / 0.22), transparent), radial-gradient(ellipse 50% 40% at 90% 0%, oklch(0.78 0.04 85 / 0.2), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[38rem] -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-7">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          Stelle
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="pb-20 pt-10 md:pb-28 md:pt-16">
          <p className="font-display text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
            Stelle
          </p>
          <h1 className="mt-5 max-w-2xl text-2xl font-medium leading-snug tracking-tight text-foreground/90 md:text-3xl">
            Fresh German tech jobs, scored honestly against your CV.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Stelle watches public career pages and ATS boards, explains every match in
            plain language, and helps you prepare a strong application — without
            scraping LinkedIn or inventing experience you don&apos;t have.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Germany · Software &amp; AI · No credit card · CV stays private
          </p>
        </section>

        <section className="grid gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/60 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-card/95 p-6 transition-colors hover:bg-card">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </section>

        <section className="py-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step} className="relative">
                <span className="font-display text-3xl font-semibold text-accent/25">{step}</span>
                <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-border/80 bg-accent px-8 py-14 text-accent-foreground md:px-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Stop refreshing five career pages a day.
          </h2>
          <p className="mt-3 max-w-md text-sm text-accent-foreground/80">
            Let Stelle watch the boards and surface the roles worth your time.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="mt-8 border-accent-foreground/20 bg-accent-foreground text-accent hover:bg-accent-foreground/90"
          >
            <Link href="/signup">
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 py-10 text-xs text-muted-foreground">
          <span>Stelle — an original application for the German software &amp; AI job market.</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </main>
    </div>
  );
}
