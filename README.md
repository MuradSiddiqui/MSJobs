# MS Jobs

AI-assisted discovery of **German software and AI jobs**. MS Jobs watches public ATS
feeds, scores postings against your CV with a transparent engine, and helps you
prepare applications — without scraping LinkedIn or inventing experience.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/SOURCES.md](docs/SOURCES.md).
The web app (Next.js on Vercel) and the ingestion worker (`npm run ingest`) share a
pure domain layer in `src/lib/core`.

## Prerequisites

- Node 24 LTS (see `.nvmrc`). Node 25 is EOL and not in Vitest 5's engine range.
- Docker, if you want local Supabase (`supabase start`)
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

## Environment

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
GROQ_API_KEY=
AI_PROVIDER=groq
AI_MODEL=openai/gpt-oss-20b
AI_MODEL_STRONG=openai/gpt-oss-120b
APP_URL=http://localhost:3000
```

Use the new publishable/secret keys, not the deprecated `anon` / `service_role` JWTs.

## Supabase setup

```bash
npx supabase start          # local, needs Docker
npx supabase db reset       # applies supabase/migrations
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

Hosted project:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Email confirmation and password reset URLs should include
`http://localhost:3000/auth/confirm` (and your production origin).

The `resumes` storage bucket is created by the initial migration and is **private**.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, complete onboarding, upload a CV.

## Running ingestion

```bash
npm run ingest
```

Optional: `npm run ingest arbeitnow greenhouse` to limit sources.

Disable a source with `INGEST_PERSONIO=0` (or any `INGEST_<NAME>=0`).
Bundesagentur is off by default (`INGEST_BUNDESAGENTUR=0`) for legal reasons.

```bash
npm run validate-boards
```

## AI configuration

All model IDs come from env vars. Structured output uses Groq strict JSON schema
via the Vercel AI SDK. Responses are Zod-validated and cached in `ai_cache`.

## Tests

```bash
npm test
npx playwright test   # optional e2e, needs the app running
```

Security and performance notes: [docs/SECURITY.md](docs/SECURITY.md).

## Deployment

### Vercel

1. Create a Vercel project from this repo.
2. Set the same env vars as `.env.example` (never expose `SUPABASE_SECRET_KEY` or
   `GROQ_API_KEY` to the client).
3. Deploy. Node version: 24 (`engines` + `.nvmrc`).

### GitHub Actions ingestion

Add repository secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `GROQ_API_KEY`
- `APP_URL`

The workflow in `.github/workflows/ingest.yml` runs every two hours with a
concurrency group so runs do not overlap. GitHub's free tier can delay cron and
disables workflows after 60 days of inactivity.

If Personio returns bot-protection from GitHub IPs, set repository variable
`INGEST_PERSONIO=0` and run that adapter from a small VPS later.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Auth pages compile but login never persists | You used `middleware.ts` instead of `proxy.ts` (Next 16) |
| `Invalid JWT` from Supabase | Publishable key sent as `Authorization: Bearer`. Use the `apikey` header via `@supabase/ssr` |
| Empty SmartRecruiters board | Wrong company identifier. `Bosch` is empty; `BoschGroup` is not |
| Personio 429 | Bot protection. Serialise requests; do not probe tenants in parallel |
| No jobs after ingest | Check `ingestion_runs` and that `SUPABASE_SECRET_KEY` is set |
| AI parse fails | Missing `GROQ_API_KEY`, or free-tier TPM exceeded |

## Product name

MS Jobs follows the MS product naming convention (MS Fin, MS Dev). It is an
original application, not a clone of any existing product.
