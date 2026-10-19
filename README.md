# MS Jobs

Live: https://ms-jobs.vercel.app

An AI-powered job search companion. Upload your CV once, and MS Jobs scores every role against it, keeps your applications organized, and helps you apply to more roles in less time.

## How it works

**1. CV parsing** — Upload your CV and a Groq LLM (`gpt-oss`) extracts your profile into structured data: skills, experience, desired roles, preferences.

**2. Job ingestion** — A worker continuously pulls fresh postings from public job board APIs, normalizes them, and filters out noise.

**3. Match scoring** — Every job is scored against your profile by a transparent multi-factor engine:
- Role title relevance
- Skill overlap
- Experience-level fit
- Eligibility gates (location, employment type, exclusions)
- Semantic similarity

Scores map to clear labels (excellent / strong / good / possible / weak) and recommendations (apply / worth applying / stretch / low priority). No black box — you can see why a role scored the way it did.

**4. Apply faster** — Line up your best matches in the auto-apply queue, filter to fresh roles, and power through applications with keyboard shortcuts.

## What it does

- **CV Studio** — Upload your CV, see it parsed into a clean preview, and keep every version in one place.
- **Smart job matching** — Every role gets a match score based on your CV and profile. No more guessing which jobs fit.
- **Auto-Apply Queue** — Line up your best matches and power through them one by one. Set a minimum score, filter to fresh roles, and apply with keyboard shortcuts.
- **Applications board** — Track every application from interested to interview in a clean pipeline view.
- **Freshness badges** — HOT for roles under 4 hours old, NEW for under 24 hours. Apply while roles are fresh.
- **Dashboard** — New roles, strong matches, and your weekly application count at a glance.

## Tech

Next.js 15, TypeScript, Supabase (Postgres + Auth + Storage), Tailwind CSS, Groq (`openai/gpt-oss-120b` / `20b`) for CV parsing and AI tasks, Vercel. Job data from public job board APIs via a Railway worker.

## Getting started

```bash
npm install
npm run dev
```

Set up your Supabase project and add the environment variables (see `.env.example`), then open http://localhost:3000.
