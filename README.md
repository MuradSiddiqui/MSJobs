# MS Jobs

Live: https://ms-jobs.vercel.app

A personal job search companion. Upload your CV once, and MS Jobs scores every role against it, keeps your applications organized, and helps you apply to more roles in less time.

## What it does

- **CV Studio** — Upload your CV, see it parsed into a clean preview, and keep every version in one place.
- **Smart job matching** — Every role gets a match score based on your CV and profile. No more guessing which jobs fit.
- **Auto-Apply Queue** — Line up your best matches and power through them one by one. Set a minimum score, filter to fresh roles, and apply with keyboard shortcuts.
- **Applications board** — Track every application from interested to interview in a clean pipeline view.
- **Freshness badges** — HOT for roles under 4 hours old, NEW for under 24 hours. Apply while roles are fresh.
- **Dashboard** — New roles, strong matches, and your weekly application count at a glance.

## Tech

Next.js, TypeScript, Supabase, Tailwind CSS. Job data comes from public job board APIs.

## Getting started

```bash
npm install
npm run dev
```

Set up your Supabase project and add the environment variables (see `.env.example`), then open http://localhost:3000.
