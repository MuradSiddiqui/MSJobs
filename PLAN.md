# Implementation Plan

Statuses: `[ ]` not started · `[~]` in progress · `[x]` completed · `[!]` blocked

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system design and
[docs/SOURCES.md](docs/SOURCES.md) for live-verified job sources.

---

## Milestones

### M0 — Docs

- [x] `docs/ARCHITECTURE.md`
- [x] `docs/SOURCES.md`
- [x] `PLAN.md` (this file)

### M1 — Foundation + UI shell + Supabase + Auth

- [x] Next.js 16 scaffold on pinned versions, Node 24 via `.nvmrc`
- [x] `src/lib/core` purity ESLint rule
- [x] shadcn/ui with restrained, professional tokens
- [x] App shell (sidebar + mobile nav)
- [x] Local Supabase (`supabase init`)
- [x] Auth: signup, login, email verification, password reset
- [x] `proxy.ts` session refresh (`getClaims()`, two-arg `setAll`)

### M2 — Onboarding + Profile + Preferences

- [x] `profiles` and `user_preferences` tables with RLS
- [x] Multi-step onboarding gated on `onboarding_completed_at`
- [x] Editable profile and preferences after onboarding

### M3 — CV upload + processing

- [x] Private Storage bucket, 5 MB cap, signed URLs only
- [x] PDF (`unpdf`) and DOCX (`mammoth`) text extraction
- [x] Resume versioning with one active CV
- [x] AI parse into Zod-validated profile; corrections go to `user_edited`

### M4 — Job database + adapter framework

- [x] Full job schema, indexes, generated freshness column
- [x] Two-phase `JobSourceAdapter` port
- [x] Hardened HTTP client (allowlist, timeout, size cap, per-host politeness)
- [x] Board registry seeded from `data/ats-boards.de.json`
- [x] Ingestion pipeline with locking and `ingestion_runs`
- [x] `npm run ingest`

### M5 — First real integrations

- [x] Arbeitnow, Greenhouse, Ashby, SmartRecruiters, Personio, Recruitee
- [x] Lever + Teamtailor if German boards are found
- [x] `scripts/validate-boards.ts` (404 / empty / healthy / bot-protection)
- [x] `scripts/sweep-boards.ts`

### M6 — Classification + deduplication + freshness

- [x] German/English taxonomy (HiWi, Werkstudent, Vollzeit, Praktikum, Abschlussarbeit)
- [x] Three-tier fingerprint dedupe + `pg_trgm` fuzzy fallback
- [x] Freshness fields; deactivation sweep only after a successful source run

### M7 — Matching engine

- [x] Eight-component weighted scorer with configurable weights
- [x] Staged relevance gate
- [x] Lexical semantic provider behind `SemanticSimilarityProvider`
- [x] Labels and recommendations

### M8 — Dashboard + search + filters

- [x] Summary cards and four dashboard sections
- [x] Browse page with URL-driven filters and sorts
- [x] Keyset pagination; list queries never select description columns

### M9 — Job details + match explanation

- [x] Full detail page
- [x] Lazy, cached AI explanation with prompt-injection defences
- [x] Visual match breakdown

### M10 — CV improvement + cover letter

- [x] Original-versus-suggested diffs; never mutate the master CV
- [x] Cover letter with regenerate / shorter / formal / technical / EN / DE
- [x] Versions stored per job in `generated_documents`

### M11 — Saved jobs + application tracker

- [x] Save / unsave / ignore / restore
- [x] Ten application statuses, pipeline + table views, status history
- [x] Separate `opened_apply_at` and `applied_at`

### M12 — Scheduled ingestion

- [x] GitHub Actions cron with concurrency group + DB lock
- [x] Per-source enable flags; configurable interval (1–3 hours)

### M13 — Testing + security + performance

- [x] Vitest: taxonomy, normalization, dedupe, scorer, AI schemas, German terms
- [x] RLS boundary tests
- [x] Playwright for critical flows

### M14 — Production deployment

- [x] README with setup, ingest, deploy
- [x] Vercel config and environment documentation
- [x] `.env.example`

---

## Decisions

DEC-001: Pin Node 24 LTS (`.nvmrc` + `engines`), not the local Node 25.
Reason: Node 25 is EOL and Vitest 5's engines field excludes it.

DEC-002: Pin TypeScript 6.x, not 7.
Reason: TS 7 is the Go rewrite with no stable JS compiler API; typescript-eslint
rejects it.

DEC-003: Use GitHub Actions for scheduled ingestion, not Vercel Hobby Cron.
Reason: Hobby Cron is once daily; we need several runs per day at low cost.

DEC-004: Two-phase adapter port (`listJobs` + optional `hydrate`).
Reason: SmartRecruiters (and BA later) return lists without descriptions; hydrating
before the relevance gate wastes requests.

DEC-005: Canonical `jobs` + `job_source_postings` rather than a flat jobs table.
Reason: The same posting appears through several sources; show once, keep metadata.

DEC-006: Add `INTERNSHIP` and `THESIS` employment categories.
Reason: Praktikum and Abschlussarbeit are misfiled as working-student otherwise.
`Wissenschaftliche Hilfskraft` is HiWi; `Wissenschaftlicher Mitarbeiter` is usually
full-time academic staff.

DEC-007: Semantic 10% starts as IDF-weighted cosine over term bags, behind
`SemanticSimilarityProvider`. pgvector is a later drop-in.
Reason: Groq has no embeddings; GitHub Actions has no local Ollama.

DEC-008: Sanitize HTML at ingestion; store both `description_html` (safe, for UI)
and `description_text` (for AI and FTS).
Reason: We render descriptions; retrofitting sanitization is harder.

DEC-009: `effective_posted_at = coalesce(posted_at, first_seen_at)` plus
`posted_at_is_estimated`. Never derive freshness from `updated_at`.
Reason: Live jobs can have old posting dates; "updated" moves on typo fixes.

DEC-010: Deactivate missing jobs only after a successful source run.
Reason: One outage must not mark the entire catalogue inactive.

DEC-011: Per-host token-bucket HTTP scheduler with 429/Retry-After backoff.
Reason: Every verified source is throttled (Arbeitnow page-19 429, Personio bot
protection, Ashby per-IP limits).

DEC-012: Sources are individually enableable per environment.
Reason: Personio may reject GitHub Actions IPs; relocating one adapter must not
require a rewrite.

DEC-013: SmartRecruiters is Phase 1 (promoted from spec Phase 2).
Reason: Only source with a real `country=de` filter; BoschGroup alone has 789 DE
jobs. Hydrate cost is paid only after the relevance gate.

DEC-014: Lever is Phase 1b until a German board is confirmed.
Reason: Cleanest ISO-2 country filter, but both research passes found zero DE boards.

DEC-015: Bundesagentur für Arbeit ships behind a disabled flag; not called by default.
Reason: Terms of use prohibit robots and using the programming interface for data
collection. Adapter exists so legal clearance is a config change.

DEC-016: Env vars use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and
`SUPABASE_SECRET_KEY` (not `anon` / `service_role`).
Reason: Legacy JWT keys are removed at the end of 2026.

DEC-017: Auth uses Next.js 16 `proxy.ts` + Supabase `getClaims()` + two-arg `setAll`.
Reason: `middleware.ts` compiles and never runs on Next 16; `getUser()` is a
network round trip; skipping cache headers risks CDN session leakage.

DEC-018: AI via Vercel AI SDK (`ai` + `@ai-sdk/groq`), not `groq-sdk`.
Reason: Provider swap to Ollama is a model-factory change. Structured output is
`generateText` + `Output.object({ schema })`.

DEC-019: Product name is Stelle.
Reason: Short German word for a job opening; not a copy of any existing product.

---

## Milestone reports

Reports are appended here as each milestone closes (completed / tested / problems /
recommended improvements / next / Cursor Recommendations).

### Close-out (M1–M14) — 2026-09-08

- Completed: full Stelle scaffold through auth, onboarding, CV, ingestion adapters,
  matching, dashboard/browse/detail, AI docs, tracker, scheduled ingest, tests, deploy docs.
- Tested: `npx tsc --noEmit`, `npx vitest run` (unit + RLS policy + security guards).
- Problems: Hosted Supabase/Vercel secrets and live ingest smoke require operator credentials;
  Docker may be unavailable for local `supabase start`.
- Recommended improvements: live board sweep results in CI, embedding-backed semantic
  provider, richer multi-step onboarding wizard UX.
- Next: create hosted Supabase project, `db push`, wire Vercel + GH secrets, run one
  ingest and walk the smoke checklist in `docs/SECURITY.md`.
- Cursor Recommendations: keep Node 24; do not scrape LinkedIn/XING; leave BA off.