# Supabase setup

Run these in the Supabase dashboard → **SQL Editor**, in order:

1. `schema.sql` — drops & recreates all tables (safe on the sandbox; **destroys existing data**), enables RLS.
2. `seed.sql` — default store `우리매장`, the standard flavor list, two sample workers.

The app opens directly — there is **no login** (v2 removed accounts/roles). An optional
4-digit app-lock PIN can be set in 설정; it's stored only on the device, never in the DB.

## Data model

One store (`stores`, single row) owns everything: `flavors`, `cabinets`, `storage`,
`workers`, `shifts`, `payroll_extras`, `sales` (tub-consumption), and `activity_log`
(the change history shown in 변경 기록).

## Security note

With no accounts, the public anon key is the only client identity, so all tables are
operable via that key. They hold no credentials or personal data beyond worker names +
wages. If you ever need true per-user protection, switch to **Supabase Auth** and key
the RLS policies to `auth.uid()`.

## Verifying

`node scripts/verify-supabase.mjs` — checks the store row loads and the tables are reachable.
