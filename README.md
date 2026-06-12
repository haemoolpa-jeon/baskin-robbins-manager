# BR 매장관리 (Baskin Robbins Store Manager) v2

A Korean-first, tablet-friendly PWA for running a Baskin Robbins store: 재고(inventory),
근무(scheduling + payroll), 주문(reorder). Built for a non-technical owner on a 9–11" touch tablet.

## Stack

- **React 18 + Vite + TypeScript** (SPA, no server)
- **Supabase** (Postgres) — data + secure name/PIN login via `SECURITY DEFINER` RPCs
- **TanStack Query** — server state, loading/error/optimistic updates
- **vite-plugin-pwa** — installable, auto-updating service worker
- **Pretendard** — Korean web font

## Develop

```bash
npm install
npm run demo             # ← try it now: in-memory sample data, NO backend needed

cp .env.example .env     # (for real use) fill in your Supabase URL + anon key
npm run dev              # http://localhost:5173 (talks to real Supabase)
npm run build            # type-check + production build → dist/
npm run test             # payroll unit tests (Vitest)
```

**Demo mode** (`npm run demo`) runs the whole app against a fake in-memory backend
seeded with sample workers/shifts/flavors. Login is pre-filled (점주 / 123456) — just
tap 로그인. Edits persist to `localStorage`; clear the site's storage to reset.

## First-time backend setup

The app needs its Supabase backend. In the Supabase dashboard → **SQL Editor**, run the
files in `supabase/` in order: `schema.sql` → `functions.sql` → `seed.sql`.
See `supabase/README.md` for details and the security model.

Default login: 이름 `점주` / 비밀번호 `123456` (change on first login).

> If the Supabase project has been idle, the free tier **pauses** it — un-pause it in the
> dashboard first, or every request fails with a network error.

Verify the backend (read-only): `node scripts/verify-supabase.mjs`.

## Deploy

Vercel auto-detects Vite (`vercel.json` pins framework + `dist/`). Set the two
`VITE_SUPABASE_*` env vars in the Vercel project. Push to deploy; the PWA auto-updates
clients on the next visit.

## Layout

```
src/
  auth/        AuthProvider (PIN login), LoginScreen
  components/  Modal, Toast, ConfirmDialog, PromptModal, Spinner, AppShell, ErrorBoundary
  data/        TanStack Query hooks (flavors, cabinets, storage, workers, shifts, …)
  features/    inventory/  timesheet/(schedule + payslip)  sales/(reorder)  admin/
  lib/         supabase, types, payroll (+ tests), date, time, money
  styles/      tokens + global + per-feature CSS
supabase/      schema.sql, functions.sql, seed.sql, README.md
legacy/        the previous vanilla-JS app (kept for reference)
```
