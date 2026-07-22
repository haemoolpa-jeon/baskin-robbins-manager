# 배포 가이드 (Deployment)

Cost-efficient, low-maintenance hosting for a **single Baskin Robbins store** used on
a few tablets/phones in Korea. Target: **managed (no servers to run), ≤ $10/month.**

## TL;DR — recommended stack (~₩0 / month)

| Piece | Service | Plan | Cost |
|---|---|---|---|
| Inventory PWA (`@br/inventory`) | **Cloudflare Pages** | Free | ₩0 |
| Database (Postgres) | **Supabase** | Free | ₩0 |
| Backups + keep-alive | **GitHub Actions** (cron) | Free | ₩0 |
| Workforce PWA (`@br/workforce`, optional) | Cloudflare Pages (2nd project) | Free | ₩0 |

**Total: ₩0/month**, comfortably under the $10 ceiling, fully managed. The budget
headroom is a safety margin — see "If you want more reliability" for paid upgrades.

> **Why Cloudflare Pages over Vercel?** The repo currently ships a `vercel.json`, and
> Vercel works technically — but Vercel's **Hobby (free) plan is non-commercial only**,
> and a store is a commercial use, so Vercel would require **Pro (~$20/mo)** — over
> budget. Cloudflare Pages' free tier permits commercial use and has generous limits
> and strong Asia/Korea edge coverage. (Plans/terms change — verify current terms when
> you set up.) Netlify free is a fine equivalent alternative.

---

## Architecture

Two independent static PWAs (built from the monorepo) talking to one shared Supabase
Postgres. No backend server of our own — the browser talks to Supabase directly via the
public anon key, and the app shell is served as static files from the CDN.

```
 tablet / phone ──HTTPS──> Cloudflare Pages (static PWA, cached at edge)
                                   │
                                   └──HTTPS──> Supabase (Postgres + REST, RLS)
```

`vercel.json` already pins the inventory build (`npm run build:inventory` →
`packages/inventory/dist`); the same two values configure any static host.

---

## One-time setup

### 1. Supabase (database)
1. Create a project (region **Northeast Asia (Seoul / ap-northeast-2)** for lowest latency).
2. In **SQL Editor**, run in order:
   - **Fresh install:** `supabase/schema.sql`, then `supabase/seed.sql`.
   - **Existing v2 DB:** run the files in `supabase/migrations/` in date order —
     currently ending with **`20260722_add_inventory_snapshots.sql`** (required for the
     new history/calendar feature; until it runs, history is inert but the app still works).
3. Copy **Project URL** and **anon public key** (Settings → API).

### 2. Cloudflare Pages (inventory app)
1. Connect the GitHub repo `haemoolpa-jeon/baskin-robbins-manager`.
2. Build settings:
   - **Build command:** `npm run build:inventory`
   - **Build output directory:** `packages/inventory/dist`
   - **Root directory:** repo root (monorepo; npm workspaces install from root)
3. Environment variables (Production + Preview):
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Deploy. Add a custom domain later if desired (free on Pages).

### 3. Workforce app (optional, later)
Second Pages project, same repo, **build command** `npm run build:workforce`,
**output** `packages/workforce/dist`, same two env vars. Only needed if/when you want
the 근무·급여 app live too.

---

## Deploy flow (after setup)
- **Push to `main`** → Cloudflare Pages auto-builds and deploys.
- The PWA service worker (`registerType: 'autoUpdate'`) refreshes clients on their next
  visit — no manual cache clearing on the tablets.
- Verify the backend any time (read-only): `node scripts/verify-supabase.mjs` (reads root `.env`).

---

## Operational notes

### Supabase free-tier pause
Free projects **pause after ~7 days of no activity**. A store used daily never hits this.
If you ever have a long closure, either open the app once, or rely on the keep-alive below.

### Backups (free)
The free tier has limited/no automated backups. A **GitHub Actions cron** covers both
backup and keep-alive at ₩0. Sketch (`.github/workflows/backup.yml`):

```yaml
name: db-backup
on:
  schedule: [{ cron: '0 18 * * *' }]   # daily; UTC (03:00 KST)
  workflow_dispatch:
jobs:
  dump:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pg_dump "$DB_URL" > backup-$(date +%F).sql
        env: { DB_URL: ${{ secrets.SUPABASE_DB_URL }} }
      - uses: actions/upload-artifact@v4
        with: { name: db-backup, path: backup-*.sql, retention-days: 30 }
```
Add `SUPABASE_DB_URL` (Settings → Database → connection string) as a repo secret. Hitting
the DB daily also keeps the project awake. (Data is small — a single store — so dumps are tiny.)

### Security posture
No accounts; the public anon key is the only client identity and RLS policies allow it to
operate the app tables (`anon_all`). The data is store inventory plus worker names/wages in
the dormant workforce tables — no payment or customer PII. This is acceptable for a private,
single-store app. If it ever needs real per-user protection, switch to Supabase Auth and key
RLS to `auth.uid()` (see `supabase/README.md`).

---

## If you want more reliability (still cheap)
- **Supabase Pro — $25/mo** (over the $10 target): daily automated backups, no pausing,
  more resources. The single upgrade worth considering if the free tier's backups/pause
  become a worry and budget allows.
- **Neon (Postgres) Free/Launch:** alternative managed Postgres; free tier autosuspends but
  resumes in ~1s. Would require swapping the data layer off Supabase's client — not worth it
  unless you leave Supabase.

## Alternatives considered (and why not)
- **Vercel:** great DX and `vercel.json` is ready, but Hobby is non-commercial → Pro (~$20/mo)
  for a store. Use only if you prefer Vercel and accept Pro.
- **Self-hosted VPS (~$5–6/mo):** lowest marginal cost, but you own OS patching, Postgres
  upgrades, TLS, and backups — against the "managed / least maintenance" goal. Not recommended
  for a non-technical owner.

## Scale headroom
One store, a handful of devices, a few hundred rows and daily snapshots. This is orders of
magnitude below every free-tier limit — no scaling concerns for the foreseeable future.
