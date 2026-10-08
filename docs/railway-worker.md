# Sharing MS Jobs with friends + Railway ingestion worker

MS Jobs is already multi-user: every table is scoped per `user_id` with Row
Level Security, and the `jobs`/`companies` boards are shared read-only feeds.
A friend just signs up at https://ms-jobs.vercel.app and gets their own
dashboard, CV, saved jobs, applications and match scores. Nothing in the code
is hardcoded to one user.

## What goes where

| Piece              | Where it runs | Why                                            |
| ------------------ | ------------- | ---------------------------------------------- |
| Web app (Next.js)  | Vercel        | Already deployed, free, fast. No change needed. |
| Database + Auth    | Supabase      | Already connected. RLS keeps each user isolated.|
| Ingestion worker   | Railway       | Runs `npm run ingest:watch` 24/7 so fresh jobs keep arriving even when your laptop is off. Vercel cannot run persistent processes. |

## Keys you need to extract (all already exist — just copy them)

From the **Supabase dashboard** (Project Settings → API):
- `NEXT_PUBLIC_SUPABASE_URL` — the Project URL (same value as on Vercel)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the publishable key (same as Vercel)
- `SUPABASE_SECRET_KEY` — the **secret** key (same as Vercel). The worker
  writes to the shared `jobs` table with the service role, bypassing RLS.
  Never expose it in the browser or commit it.

From the **Groq console** (https://console.groq.com → API Keys):
- `GROQ_API_KEY` — used for AI match scoring during ingestion and in the app.
  Note: friends using the site consume *your* Groq quota. Fine for a small
  circle; if usage grows, set `INGEST_INTERVAL_MINUTES=240` or narrow
  `INGEST_SOURCES`.

Optional tuning:
- `INGEST_INTERVAL_MINUTES` — default `60`. `120` (every 2 hours) is plenty
  for job boards and halves AI usage.
- `INGEST_SOURCES` — comma allow-list, e.g. `greenhouse,ashby,lever`.

## Railway setup (your clicks)

1. Go to https://railway.app → **New Project** → **Deploy from GitHub repo** →
   select `MuradSiddiqui/job-finder`.
2. Railway detects `railway.json` and builds `Dockerfile.worker` automatically.
3. Open the service → **Variables** → add the 4 required keys above
   (paste the exact values from Vercel/Supabase/Groq).
4. **Deploy**. Open **Logs** — you should see
   `Ingest loop started. Running every 120 minute(s).` followed by per-source
   fetch summaries.
5. Done. The worker now ingests on its own schedule forever.

Cost note: Railway's free trial covers a small worker like this; afterwards it
is usage-based (a few dollars/month for an always-on 0.5 vCPU service).

## Supabase checklist (one time)

1. **Authentication → Sign-ups**: make sure "Enable sign up" is ON so friends
   can create accounts.
2. **Authentication → Email**: decide whether to require email confirmation.
   If ON, friends must click the link in their inbox before first login.
3. That's it — RLS policies already isolate every user's data.

## Sharing with friends

Just send them https://ms-jobs.vercel.app. They sign up, upload their CV,
and get their own scored matches. Your data stays private to you.

If a friend later wants their *own* copy: they fork the repo, create their
own Supabase project, run the migrations in `supabase/migrations`, set the
same 4 keys, and deploy — this doc covers the worker half of that.
