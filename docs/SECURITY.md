# Security & performance pass (M13)

## Security

- Private `resumes` bucket; object policies require `auth.uid()` folder prefix
- User tables RLS-enabled with owner policies (`auth.uid() = user_id` / `id`)
- Jobs/companies readable to authenticated users; writes only via service role ingest
- SSRF-hardened HTTP client: DNS allowlist, private IP block, size/timeout caps, per-host politeness
- JD text treated as untrusted input via `wrapUntrusted` + truthfulness rules
- No LinkedIn/XING scraping; Bundesagentur ingest off by default
- Secrets stay server-side (`SUPABASE_SECRET_KEY`, `GROQ_API_KEY`); publishable key only in client env

## Performance

- Job list queries omit `description_*` columns
- Keyset pagination (`cursor`) on browse for newest/discovered sorts
- Match scores computed deterministically in ingest; AI explanations lazy + `ai_cache`
- Ingestion uses DB lock + GitHub Actions concurrency group
- Dashboard/list pages use counts and limited selects (top N)

## Production smoke checklist

1. Sign up → verify email → complete onboarding
2. Upload CV → review/correct parsed JSON
3. Run `npm run ingest` against hosted Supabase
4. Open dashboard and jobs browse; open a detail page
5. Save / ignore / explain match / generate cover letter
6. Mark applied; change status on Applications board
