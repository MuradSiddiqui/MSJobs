import Link from "next/link";
import {
  ArrowRight,
  FileSearch,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const ATS_SOURCES = [
  "Greenhouse",
  "Ashby",
  "Lever",
  "Personio",
  "SmartRecruiters",
  "Workable",
  "Teamtailor",
  "Recruitee",
];

const SCORE_BARS = [
  { label: "Role fit", value: 95, tone: "bg-emerald-400" },
  { label: "Skills", value: 90, tone: "bg-teal-300" },
  { label: "Location", value: 85, tone: "bg-sky-300" },
];

const MOCK_JOBS = [
  { title: "Senior AI Engineer", company: "Response Informatics", score: 92 },
  { title: "Frontend Developer (Werkstudent)", company: "Deepslate", score: 88 },
  { title: "Working Student - AI Automation", company: "Finanz Informatik", score: 81 },
];

const STEPS = [
  { title: "Upload your CV", description: "PDF or DOCX. We parse it into a structured profile you can correct." },
  { title: "Set your preferences", description: "Roles, cities, remote policy, employment type - HiWi to full-time." },
  { title: "Browse scored matches", description: "See why a job fits, save the good ones, track your applications." },
];

function MitsuMascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 232" className={className} role="img" aria-label="Mitsu, your match assistant">
      <ellipse cx="70" cy="220" rx="52" ry="10" fill="#1E2A3A" opacity="0.12" />
      <rect x="67" y="6" width="6" height="28" rx="3" fill="#1E2A3A" />
      <circle cx="70" cy="12" r="9" fill="#B45309" stroke="#1E2A3A" strokeWidth="3" />
      <circle cx="70" cy="62" r="44" fill="#FFFFFF" stroke="#1E2A3A" strokeWidth="3.5" />
      <ellipse cx="54" cy="58" rx="6" ry="8.5" fill="#1E2A3A" />
      <ellipse cx="86" cy="58" rx="6" ry="8.5" fill="#1E2A3A" />
      <circle cx="56" cy="55" r="2" fill="#FFFFFF" />
      <circle cx="88" cy="55" r="2" fill="#FFFFFF" />
      <ellipse cx="41" cy="75" rx="8" ry="5" fill="#F4A7C3" />
      <ellipse cx="99" cy="75" rx="8" ry="5" fill="#F4A7C3" />
      <rect x="4" y="122" width="22" height="46" rx="11" fill="#155E75" stroke="#1E2A3A" strokeWidth="3.5" transform="rotate(18 15 145)" />
      <rect x="114" y="122" width="22" height="46" rx="11" fill="#155E75" stroke="#1E2A3A" strokeWidth="3.5" transform="rotate(-18 125 145)" />
      <rect x="22" y="106" width="96" height="106" rx="28" fill="#0E7490" stroke="#1E2A3A" strokeWidth="3.5" />
      <rect x="48" y="142" width="44" height="42" rx="14" fill="#FFFFFF" opacity="0.28" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* mesh gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-drift-slow absolute -top-32 right-[8%] h-[34rem] w-[34rem] rounded-full bg-teal-300/40 blur-[130px] dark:bg-teal-400/15" />
        <div className="animate-drift-slow absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-amber-300/40 blur-[140px] dark:bg-amber-400/10" style={{ animationDelay: "-8s" }} />
        <div className="animate-drift-slow absolute left-[38%] top-[26rem] h-[24rem] w-[24rem] rounded-full bg-sky-300/35 blur-[150px] dark:bg-sky-400/10" style={{ animationDelay: "-16s" }} />
      </div>

      {/* floating glass nav */}
      <div className="sticky top-4 z-40 mx-auto max-w-6xl px-4">
        <header className="animate-fade-up flex items-center justify-between rounded-full border border-border/70 bg-card/70 py-2.5 pl-6 pr-2.5 shadow-lg shadow-black/5 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-semibold tracking-tight">MS Jobs</span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
              Beta
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#testimonial" className="transition-colors hover:text-foreground">Reviews</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </header>
      </div>

      <main>
        {/* hero */}
        <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-14 text-center md:pt-20">
          <div className="halftone pointer-events-none absolute right-[4%] top-10 hidden h-28 w-44 opacity-60 lg:block" aria-hidden />
          <p className="animate-fade-up mx-auto inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background">
            <Sparkles className="h-3.5 w-3.5" />
            New: dark mode is here - one tap, whole app
          </p>
          <h1 className="animate-fade-up mx-auto mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl" style={{ animationDelay: "90ms" }}>
            Stop job hunting.{" "}
            <em className="text-accent">Start matchmaking.</em>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg" style={{ animationDelay: "180ms" }}>
            MS Jobs watches German ATS boards around the clock, scores every posting
            against your CV with a transparent 8-factor engine, and drafts your
            application.
          </p>
          <div className="animate-fade-up relative mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "270ms" }}>
            <div aria-hidden className="pointer-events-none absolute -left-2 top-1/2 hidden -translate-y-1/2 gap-1 md:flex">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="block h-1 rounded-full bg-accent/70" style={{ width: 54 - i * 9, transform: `translateY(${(i - 1.5) * 9}px) rotate(-12deg)` }} />
              ))}
            </div>
            <Button asChild size="lg" className="rounded-2xl px-8 py-6 text-base shadow-xl shadow-accent/25 transition-transform hover:scale-[1.03] active:scale-95">
              <Link href="/signup">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl bg-card/80 px-8 py-6 text-base backdrop-blur transition-transform hover:scale-[1.03] active:scale-95">
              <Link href="/login">
                <Play className="h-4 w-4" />
                Watch 2-min tour
              </Link>
            </Button>
          </div>
          <div className="animate-fade-up mt-8 flex items-center justify-center gap-3" style={{ animationDelay: "360ms" }}>
            <div className="flex -space-x-2.5">
              {["M", "A", "S", "J", "K"].map((initial, i) => (
                <span
                  key={initial}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-xs font-bold text-white"
                  style={{ background: ["#0E7490", "#15803D", "#B45309", "#2563EB", "#7C3AED"][i] }}
                >
                  {initial}
                </span>
              ))}
            </div>
            <div className="text-left">
              <p className="flex gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Loved by 2,000+ job seekers</p>
            </div>
          </div>

          {/* anime accents */}
          <div className="sticker animate-pop absolute right-[6%] top-24 hidden rotate-[-6deg] px-4 py-2 text-sm font-bold lg:block" style={{ animationDelay: "500ms" }}>
            100% transparent
          </div>
          <MitsuMascot className="animate-squash absolute -left-2 top-[26rem] hidden w-28 lg:block" />
          <p className="absolute -left-2 top-[26rem] hidden pt-56 text-[11px] font-medium text-muted-foreground lg:block">
            Mitsu - your match assistant
          </p>
          <span aria-hidden className="animate-float absolute left-[12%] top-40 hidden text-2xl text-accent lg:block">✦</span>
          <span aria-hidden className="animate-float absolute right-[16%] top-64 hidden text-lg text-amber-500 lg:block" style={{ animationDelay: "-2.5s" }}>✦</span>
        </section>

        {/* product preview */}
        <section className="animate-fade-up mx-auto max-w-5xl px-6" style={{ animationDelay: "200ms" }}>
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_32px_80px_-24px_oklch(0.22_0.02_255/0.25)]">
            <div className="flex items-center gap-2 border-b border-border/70 px-5 py-3.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="mx-auto hidden rounded-full bg-muted px-6 py-1 text-xs text-muted-foreground sm:block">
                ms-jobs.vercel.app/dashboard
              </span>
              <span className="w-14" />
            </div>
            <div className="flex">
              <div className="hidden w-44 shrink-0 space-y-1 border-r border-border/60 bg-muted/50 p-3 sm:block">
                <p className="px-2 pb-2 font-display text-sm font-semibold">MS Jobs</p>
                {["Dashboard", "Jobs", "Saved", "Applications"].map((item, i) => (
                  <p key={item} className={`rounded-lg px-2.5 py-2 text-xs ${i === 0 ? "bg-accent/15 font-semibold text-accent" : "text-muted-foreground"}`}>
                    {item}
                  </p>
                ))}
              </div>
              <div className="min-w-0 flex-1 space-y-3 p-5">
                <p className="font-display text-base font-semibold tracking-tight">Top matches for you</p>
                {MOCK_JOBS.map((job) => (
                  <div key={job.title} className="flex items-center gap-4 rounded-xl bg-muted/60 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                    </div>
                    <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-border/70 sm:block">
                      <div className="animate-bar h-full rounded-full bg-accent" style={{ width: `${job.score}%` }} />
                    </div>
                    <span className="text-sm font-bold tabular-nums text-accent">{job.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="sticker animate-pop mx-auto -mt-5 w-fit rotate-[4deg] px-4 py-2 text-sm font-bold" style={{ animationDelay: "700ms" }}>
            ATS-powered
          </div>
        </section>

        {/* marquee */}
        <section className="mt-20 overflow-hidden">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Powered by real ATS feeds - no scraping, no invented jobs
          </p>
          <div className="marquee-paused relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <div className="animate-marquee flex w-max gap-3.5 py-1">
              {[...ATS_SOURCES, ...ATS_SOURCES].map((source, i) => (
                <span key={`${source}-${i}`} className="rounded-full border border-border/80 bg-card px-6 py-3 text-sm font-semibold text-muted-foreground shadow-sm">
                  {source}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground/70">marquee - infinite scroll - pauses on hover</p>
        </section>

        {/* bento features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-28 px-6 py-24">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-accent">Why MS Jobs</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Built different, <em className="text-accent">on purpose.</em>
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="animate-fade-up rounded-3xl bg-[#16202e] p-8 text-white">
              <h3 className="font-display text-2xl font-semibold tracking-tight">Transparent scoring</h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
                Every match is an eight-component, explainable score. No black box - you see
                exactly why a role fits.
              </p>
              <div className="mt-7 space-y-4">
                {SCORE_BARS.map((bar, i) => (
                  <div key={bar.label} className="flex items-center gap-3">
                    <span className="w-20 text-xs font-medium text-white/60">{bar.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className={`animate-bar h-full rounded-full ${bar.tone}`} style={{ width: `${bar.value}%`, animationDelay: `${300 + i * 150}ms` }} />
                    </div>
                    <span className="w-10 text-right text-xs font-bold tabular-nums">{bar.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-fade-up rounded-3xl border border-border/80 bg-card p-8" style={{ animationDelay: "120ms" }}>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                <Sparkles className="mr-2 inline h-5 w-5 text-accent" />
                AI that assists, not lies
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Plain-language match explanations, CV suggestions, and drafted cover letters -
                grounded in your real CV.
              </p>
              <div className="mt-7 rounded-2xl bg-muted/70 p-5">
                <p className="text-sm font-semibold">Why do I match this role?</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Your RAG experience maps directly to their stack, and the hybrid setup fits
                  your location preference...
                </p>
              </div>
            </div>
            <div className="animate-fade-up rounded-3xl border border-border/80 bg-card p-8" style={{ animationDelay: "180ms" }}>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <FileSearch className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight">Real ATS feeds</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Greenhouse, Ashby, Personio, Lever - never scraped, never invented.
              </p>
            </div>
            <div className="animate-fade-up rounded-3xl border border-border/80 bg-card p-8" style={{ animationDelay: "240ms" }}>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight">Always fresh</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Scheduled ingestion with dedupe. The same posting never shows twice.
              </p>
            </div>
          </div>
        </section>

        {/* steps */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-28 px-6 pb-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            From CV to offer letter in three steps.
          </h2>
          <div className="relative mt-12 grid gap-10 md:grid-cols-3">
            <div aria-hidden className="absolute left-[16%] right-[16%] top-6 hidden border-t-2 border-dashed border-border md:block" />
            {STEPS.map((step, i) => (
              <div key={step.title} className="animate-fade-up relative" style={{ animationDelay: `${i * 120}ms` }}>
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-accent-foreground shadow-lg shadow-accent/30">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* testimonial */}
        <section id="testimonial" className="mx-auto max-w-6xl scroll-mt-28 px-6 pb-24">
          <div className="animate-fade-up mx-auto max-w-3xl rounded-3xl border border-border/80 bg-card p-10 text-center shadow-xl shadow-black/5 md:p-14">
            <p className="flex justify-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </p>
            <blockquote className="mt-6 font-display text-2xl font-medium italic leading-snug tracking-tight md:text-[1.7rem]">
              "I stopped refreshing five career pages a day. MS Jobs surfaces the three roles
              actually worth my time."
            </blockquote>
            <p className="mt-6 text-sm font-medium text-muted-foreground">
              Murad S. - M.Sc. candidate, Frankfurt
            </p>
          </div>
        </section>

        {/* CTA banner */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="animate-fade-up relative overflow-hidden rounded-[2rem] bg-[#16202e] px-8 py-16 text-center text-white md:py-20">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-accent/50 blur-[120px]" />
            <div aria-hidden className="halftone-light pointer-events-none absolute bottom-6 left-8 h-24 w-40 opacity-40" />
            <div className="sticker absolute right-8 top-8 hidden rotate-[8deg] px-3 py-1.5 text-xs font-bold text-[#16202e] md:block" style={{ borderColor: "#16202e", boxShadow: "4px 4px 0 #16202e" }}>
              Free forever plan
            </div>
            <h2 className="relative font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Your next role is <em className="text-teal-300">already posted.</em>
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-white/70">
              Let MS Jobs find it before anyone else does.
            </p>
            <Button asChild size="lg" className="relative mt-9 rounded-2xl bg-accent px-8 py-6 text-base text-white shadow-xl shadow-accent/30 transition-transform hover:scale-[1.03] active:scale-95">
              <Link href="/signup">
                Create your free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-border/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-accent" />
              MS Jobs - an original application for the German software &amp; AI job market.
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Germany · Software &amp; AI · No credit card · CV stays private · © {new Date().getFullYear()}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
