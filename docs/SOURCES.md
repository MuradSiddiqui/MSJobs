# Job Sources

Every endpoint here was called live on **2026-09-03/04** and verified independently
by two research passes. Anything unverified is marked as such. Re-verify before
relying on any of it, because ATS endpoints and board tokens both rot.

- [Phase 1](#phase-1-implemented-first)
- [Phase 1b](#phase-1b-cheap-additions)
- [Phase 2 and experimental](#phase-2-and-experimental)
- [Excluded and why](#excluded-and-why)
- [Timestamp reliability](#timestamp-reliability)
- [Board registry strategy](#board-registry-strategy)
- [Confirmed live board tokens](#confirmed-live-board-tokens)

## Phase 1, implemented first

### Arbeitnow

```
GET https://www.arbeitnow.com/api/job-board-api?page=N
GET https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true
```

No auth. 175 jobs on page 1, then 100 per page; roughly 1,900 jobs over 7–8 days of
history, refreshed hourly. About 58% of postings have a German location.

Fields: `slug`, `company_name`, `title`, `description` (HTML), `remote` (bool),
`url`, `tags[]`, `job_types[]`, `location`, `created_at` (Unix epoch).

Caveats:

- **Returns HTTP 429 around page 19.** Pagination must back off.
- `created_at` is Arbeitnow's index time, not the employer's publish time. Where a
  job also appears on its origin ATS, prefer the ATS timestamp.
- No country field, no salary, and `url` points at Arbeitnow rather than the
  employer, so there is no true apply URL.
- `job_types[]` is free text and wildly inconsistent — observed values include
  `berufserfahren`, `Working student`, `hilfstätigkeit / student`, `Full-time
  fixed-term`, `Intern`, and `teamleitung`. This is the clearest proof that
  employment-category detection must be our own normalizer rather than a passthrough.

Terms are stated in the payload itself: free public API, please do not abuse,
attribution appreciated. Arbeitnow aggregates Greenhouse, SmartRecruiters, JOIN,
Teamtailor, Recruitee, and Comeet, which also makes it a useful discovery oracle
(see [Board registry strategy](#board-registry-strategy)).

### Greenhouse

```
GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs
GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
```

No auth. `job-boards.greenhouse.io` is **not** an API host — it serves careers pages
and 404s on API paths.

`first_published` is a real posting date and was present on 756 of 758 sampled jobs.
Critically, **it is returned without `content=true`**: the plain call is around 46 KB
versus 685 KB with content. So fetch the cheap list, diff against the database, and
only pay for the content payload when a board actually has new jobs.

Fields: `id`, `internal_job_id`, `requisition_id`, `title`, `company_name`,
`absolute_url`, `location.name` (free text), `first_published`, `updated_at`,
`language`, `metadata[]`, `data_compliance[]`. With `content=true`: `content`
(HTML), `departments[]`, `offices[]`.

Caveats:

- `content` is **double HTML-entity-escaped** and must be unescaped twice.
- `offices[].location` carries an ISO-3 country code such as `DEU`, which is the
  most reliable Germany signal here; `location.name` is messy free text with
  inconsistencies like `"Zurich "` versus `"Zürich"`.
- No salary, no remote flag, no employment type except where a company happens to
  expose one via `metadata`.
- Rate limits are unpublished. Poll each board every few hours.

### Ashby

```
GET https://api.ashbyhq.com/posting-api/job-board/{org}?includeCompensation=true
```

No auth, clean 404 on an unknown org. The best payload of any per-company source.

Fields: `id` (UUID), `title`, `department`, `team`, `employmentType` (enum such as
`FullTime`), `location`, `secondaryLocations[]` with
`address.postalAddress.{addressCountry,addressLocality,addressRegion}`,
`publishedAt` (ISO with ms, present on 100% of postings), `isListed`, `isRemote`,
`workplaceType`, `jobUrl`, `applyUrl`, `descriptionHtml`, `descriptionPlain`,
`compensation`.

Caveats:

- **Rate-limited per IP** and explicitly documented as unsuitable for high-volume
  polling.
- **Skip `isListed: false`.** Those are deliberately unlisted roles.
- No `updatedAt`, only `publishedAt`.

### SmartRecruiters

```
GET https://api.smartrecruiters.com/v1/companies/{companyId}/postings?country=de&limit=100&offset=0
GET https://api.smartrecruiters.com/v1/companies/{companyId}/postings/{postingId}
```

No auth. Promoted from the spec's Phase 2 because it is the only source with a
genuine server-side country filter, and it reaches the German enterprise layer that
startup-focused systems miss. `BoschGroup` returns 4,825 postings globally and 789
with `country=de`.

List fields: `id`, `uuid`, `name`, `refNumber`, `company`, `releasedDate` (ISO with
ms), `location{city, region, country, address, postalCode, remote, hybrid, latitude,
longitude, fullLocation}`, `typeOfEmployment`, `experienceLevel`, `function`,
`industry`, `language.code`, `customField[]`. `location.region` carries German state
codes such as `BY`, and `language.code` separates German- from English-language ads.

**Descriptions are not in the list response.** The detail call adds `applyUrl`,
`postingUrl`, and `jobAd.sections{companyDescription, jobDescription, qualifications,
additionalInformation}`. This is exactly what the adapter's `hydrate` step exists
for: we only fetch details for postings that clear the relevance gate.

Caveats:

- **A wrong company identifier returns HTTP 200 with `totalFound: 0`, not a 404.**
  `bosch`, `Bosch`, `zalando`, `SAP`, `Zeiss` were all silently empty; the correct
  token is `BoschGroup`. Board health monitoring therefore cannot distinguish a bad
  token from an empty board, so these need manual confirmation.
- There is no cross-company endpoint. Per-company iteration only.

### Personio

```
GET https://{tenant}.jobs.personio.de/xml
GET https://{tenant}.jobs.personio.com/xml
```

No auth. The highest German density of any legally clean source, and the only one
that reaches the Mittelstand layer.

Root element is `<workzag-jobs>` containing `<position>` elements with `id`,
`subcompany`, `office`, `additionalOffices`, `department`, `recruitingCategory`,
`name`, `jobDescriptions/jobDescription{name,value}` (CDATA HTML, split into named
sections), `employmentType`, `seniority`, `schedule`, `yearsOfExperience`,
`keywords`, `occupation`, `occupationCategory`, `createdAt` (ISO with timezone).

Caveats:

- **Bot protection is the main operational risk.** Probing 21 tenants in parallel
  returned HTTP 429 with a Vercel Security Checkpoint page on 15 of them. Fetch
  serially with realistic headers, follow redirects, and back off. This may reflect
  IP reputation, so it could behave differently from GitHub Actions runners than
  from a local machine.
- Tenant existence probe: **200 means the tenant exists** (even when the XML is an
  empty 72-byte document); **307 redirecting to Personio marketing means it does
  not**. The `.de` versus `.com` TLD varies per tenant, so probe both.
- **No apply URL in the feed.** Construct
  `https://{tenant}.jobs.personio.{de|com}/job/{id}`.
- Field presence varies significantly by tenant. `<office>` is sometimes absent
  entirely, and `<jobDescriptions>` is sometimes empty, so never assume a
  description is present.
- No country field, no remote flag, no salary.

### Recruitee

```
GET https://{company}.recruitee.com/api/offers/
```

No auth. The richest schema of any source here, all in one request with no
pagination.

**The URL shape in the original specification is wrong.**
`api.recruitee.com/c/{company}/careers/offers` 404s; `api.recruitee.com` is the
authenticated admin surface. The public careers API lives on the tenant subdomain.

Fields include `id`, `slug`, `title`, `description` (HTML), `requirements` (HTML),
`city`, `country`, `country_code` (ISO-2), `state_code`, `location`, `locations[]`,
separate `remote`/`hybrid`/`on_site` booleans, `employment_type_code`,
`experience_code`, `education_code`, `min_hours`, `max_hours`,
`salary{min,max,period,currency}`, `created_at`, `published_at`, `updated_at`,
`close_at`, `careers_url`, `careers_apply_url`, `company_name`, `tags`.

## Phase 1b, cheap additions

### Lever

```
GET https://api.lever.co/v0/postings/{site}?mode=json
GET https://api.eu.lever.co/v0/postings/{site}?mode=json
```

Not deprecated — Lever's own position is that v0 Postings and v1 Hire serve different
purposes, and the README states published postings may be scraped by third parties.

It has the cleanest Germany filter of any source: a top-level ISO-2 `country` field,
so `country === 'DE'` with no string matching. Also `categories{location, team,
commitment, allLocations}`, `workplaceType`, `createdAt` (epoch ms), `applyUrl`,
`hostedUrl`, `description`/`descriptionPlain`.

Deprioritised because **neither research pass could confirm a single German Lever
board**, so its German density is unquantified. Two implementation notes: it
intermittently returns HTML even with `mode=json`, so check `Content-Type` before
parsing and retry; and try the US host first, falling back to the EU host on 404.

### Teamtailor

```
GET https://{company}.teamtailor.com/jobs.json
GET https://{company}.teamtailor.com/jobs.rss
```

Upgraded from the spec's Phase 2. `jobs.json` is a JSON Feed v1 document whose items
carry a **full schema.org `JobPosting` object** in `_jobposting`, which is the
cleanest normalization target of any source here and makes the adapter nearly
trivial. The RSS variant provides `pubDate` (RFC 822), `remoteStatus`, and a `tt:`
namespace with structured locations, but descriptions are double-escaped.

The authenticated `api.teamtailor.com` is not usable for aggregation: it requires a
per-tenant token plus an `X-Api-Version` header, so one key reads one tenant.

German tenant density unconfirmed.

## Phase 2 and experimental

### Workable

```
GET https://apply.workable.com/api/v1/widget/accounts/{account}?details=true
```

Works but is the widget backend rather than a published API, so it can change without
notice. The documented `www.workable.com/api/accounts/{sub}` path 302s behind
Cloudflare.

**`published_on` and `created_at` are date-only with no time component**, which
breaks the core "last 24 hours" filter — this source needs our own `first_seen_at`.
Read `locations[]`, not just the top-level `city`, or every location past the first is
silently dropped. An account that exists but has no published jobs returns 200 with
`{"jobs":[]}`, while an invalid subdomain returns a clean 404.

### JOIN

Genuinely German-focused, but requires two steps: fetch `https://join.com/companies/{slug}`
and regex a numeric company ID out of an embedded Next.js payload, then call
`https://join.com/api/public/companies/{numericId}/jobs?locale=en-us&page=N&pageSize=50`.
Note the host is `join.com`, not `api.join.com`.

Fragile and clearly outside an intended integration path. Experimental only, behind a
disabled flag.

## Excluded and why

### Bundesagentur für Arbeit — legal

```
GET https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v6/jobs
Header: X-API-Key: jobboerse-jobsuche
```

Technically the best German source by a wide margin, and the one most worth
revisiting. Notes for whenever that happens:

- **The widely-copied `pc/v4/jobs` endpoint now returns 403. Only `pc/v6/jobs`
  works.** Detail is still `pc/v4/jobdetails/{base64(referenznummer)}`.
- The key alone is insufficient: a default curl User-Agent gets 403 even with a
  correct key. A browser-like User-Agent returns 200, and the response carries
  `vary: User-Agent` and `x-api-blocked`.
- `veroeffentlichtseit=0` returns only same-day postings — verified, and genuinely
  the best freshness filter of any source.
- Real employer-stated salary bands via `gehaltsspanneVon`/`gehaltsspanneBis`.
  Around 10,000 postings under `berufsfeld=Informatik`.
- Do not pass `wo=Deutschland`, which reproducibly breaks result-count monotonicity
  across freshness windows.

**Why it is excluded:** there is no developer portal and no registration path. The
documentation is a volunteer reverse-engineering project and the static key is an
internal app identifier, not a licence. The terms of use prohibit, verbatim, using
"robots, web spiders or similar technologies, or existing communication or
programming interfaces contrary to the BA's intended purpose, and thus to read out
content from the portal or apps." That names this use case explicitly. The BA
asserts full copyright, no open-data licence applies, and it publicly objected in
2021 to the API being openly documented. Ships behind a disabled feature flag
pending German legal advice.

### Adzuna — commercial terms

Free tier is 25/minute, 250/day, 1,000/week, 2,500/month. More decisively,
commercial use is permitted only under a 14-day evaluation trial, after which the
data may not be used "in its original format or in aggregation" without written
consent. Descriptions are excerpts and salaries are often model-predicted.

### LinkedIn, XING, Indeed, StepStone — no read API exists

All four have APIs, and all four are **posting** APIs for pushing jobs in, not
pulling them out.

- **XING** closed public API registration in 2016 and support in 2017. The surviving
  developer surface is an inbound feed for contracted customers.
- **Indeed** deprecated job search in 2021 and wound down the Publisher API around
  2023. What remains is employer-side and gated behind a signed agreement.
- **LinkedIn**'s Job Posting API is partner-gated, publish-only, with no search
  capability. It is also the highest enforcement risk: LinkedIn sued Proxycurl in
  January 2025 and the defendant shut down rather than litigate.
- **StepStone**'s `api.stepstone.com` is an inbound job-posting feed requiring a
  contract and issued credentials.

We store and link legitimate external job URLs, recognise LinkedIn/XING URLs that
arrive through permitted sources, and offer "View original posting" links. We never
scrape them and never store a user's credentials for them.

The useful reframe: Indeed and StepStone largely syndicate **from** the ATS platforms
above, so reading those upstream sources yields substantially the same German
inventory without the legal exposure.

### Remote aggregators — low Germany signal

Remotive, Jobicy, Himalayas, and WeWorkRemotely are all live and free, but geography
appears as a *restriction* (`"Europe, USA"`, `locationRestrictions: ["Philippines"]`)
rather than a city or country. Note that Himalayas silently ignores
`?country=Germany`. Not worth integrating for core German coverage.

## Timestamp reliability

Precise publish timestamps, usable directly for a 24-hour filter: Greenhouse
`first_published`, Ashby `publishedAt`, SmartRecruiters `releasedDate`, Recruitee
`published_at`, Personio `createdAt`, Lever `createdAt` (epoch ms), Teamtailor
`pubDate`, Arbeitnow `created_at` (index time, so lower priority).

Date-only, insufficient alone: Workable, and Bundesagentur's
`datumErsteVeroeffentlichung`.

Two rules that follow:

1. **Never key freshness off an "updated" field.** Greenhouse's `updated_at` and
   Recruitee's `updated_at` move when an employer fixes a typo, which would resurface
   weeks-old jobs into the 24-hour feed.
2. **Always record our own `first_seen_at`** regardless of source, and use it as a
   floor. Greenhouse's `first_published` describes the *current* publication, so an
   unpublished-then-republished role presents as new.

Note that Parloa was observed still listing a posting from August 2025, so live jobs
genuinely can carry old publish dates. That is why `posted_at_is_estimated` exists.

## Board registry strategy

No ATS vendor publishes a customer directory, and the sitemaps on all four vendor
board hosts 404. Roughly half of plausible-looking tokens are dead — `zalando`,
`flixbus`, `taxfix`, `sennder`, `adjust`, `helsing`, and `trade-republic` are not on
the systems you would expect.

Four approaches, in order of leverage:

1. **Seed from public datasets.** The LastRound AI ATS Company Directory is CC BY
   4.0 with 9,935 company-to-board mappings (Greenhouse 4,966, Ashby 2,856, Lever
   2,113). A 300-board sample found 96.7% still resolve, but only 8.3% carry any
   German job — extrapolating to roughly 800 German-relevant boards and 13,000 German
   jobs. So sweep once, persist a `de_relevant` flag, then poll only the shortlist.
   Do **not** filter the dataset by company name: only 21 of 9,935 rows match
   `GmbH|AG|SE`, because the companies are named Celonis, n8n, and Helsing.
2. **Use Arbeitnow as a discovery oracle.** It aggregates six ATS platforms, so its
   `company_name` values are a pre-filtered list of German employers already known to
   sit on a readable ATS. This is the cheapest high-yield trick available.
3. **Detect the ATS from careers pages** for the platforms no dataset covers
   (Personio, SmartRecruiters, Recruitee, Teamtailor, Workable, JOIN) by identifying
   the outbound host a company's careers page references. This is the only route to
   Personio and Recruitee coverage.
4. **Treat the registry as decaying state, not config.** Store `last_ok_at` and
   `consecutive_failures`; back off exponentially on 404 streaks; retire a board only
   after several consecutive failures, since boards legitimately drop to zero open
   roles; re-resolve quarterly because companies switch vendors.

Health checks must distinguish four outcomes: 404 (slug dead, retire), 200 with zero
jobs (alive but empty, keep polling), 200 with jobs (healthy), and bot-protection
(back off, do not retire). Slug guessing is cheap for Greenhouse, Ashby, and Lever
because they 404 cleanly, but must be slow and manually confirmed for Personio (429)
and SmartRecruiters (silent `totalFound: 0`).

## Confirmed live board tokens

Verified with a live 200 response and a non-empty body on 2026-09-03/04. This is the
MVP seed list in `data/ats-boards.de.json`.

**Greenhouse:** `celonis` (273 jobs), `n26` (68), `getyourguide` (58), `sumup`,
`raisin`, `doctolib`. Confirmed *not* on Greenhouse: `zalando`, `deliveryhero`,
`flixbus`, `adjust`, `taxfix`, `personio`, `sennder`, `wefox`, `mistralai`.

**Ashby:** `deepl` (67 jobs, 15 German), `pennylane` (163), `parloa` (52, 29
German), `n8n`, `black-forest-labs`, `langfuse`. Confirmed 404: `helsing`,
`quantco`, `blackshark`.

**SmartRecruiters:** `BoschGroup` (4,825 total, 789 German), `Continental`.

**Personio:** `wandelbots`, `userlane`, `everphone`, `personio`. Valid but empty:
`tacto`, `konux`, `tado`, `finn`, `solarisbank`. Confirmed non-existent (307):
`sennder`, `roadsurfer`, `enpal`, `isar-aerospace`, `celonis`, `flixbus`,
`getyourguide`, `wefox`, `raisin`, `trade-republic`, `mambu`, `forto`.

**Recruitee / Lever / Teamtailor:** endpoint shapes verified, but no German tenant
confirmed yet. These need the discovery sweep before they contribute.
