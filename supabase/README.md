# Supabase setup

Run these files in the Supabase dashboard **SQL Editor**:

1. For a new/demo database, run `schema.sql`, then `seed.sql`.
2. For an existing database, keep the current data and run the files in `migrations/` in date order.

`schema.sql` drops and recreates the app tables, so do not run it against a database whose data must be preserved. `20260717_expand_inventory_domains.sql` adds the inventory fields, and `20260717_refresh_official_catalog.sql` non-destructively adds the researched 2026-07-17 menu catalog. New catalog items start at zero stock; existing quantities and custom products remain untouched.

The app opens directly with no login. An optional four-digit app-lock PIN can be set in Settings; it stays on the device and is not stored in Supabase.

## Data model

One store (`stores`, single row) owns the inventory data:

- `flavors`, `cabinets`, and `storage` for ice cream
- `inventory_products` for cakes, desserts, and supplies
- `sales` for tub-consumption estimates
- `activity_log` for the change history

The older workforce tables (`workers`, `shifts`, and `payroll_extras`) are retained for backward compatibility, but they are no longer exposed by the inventory app shell. A separate workforce app can reuse or migrate them later.

## Security note

With no accounts, the public anonymous key is the only client identity, so the current RLS policies permit that key to operate the app tables. For real per-user protection, add Supabase Auth and key the policies to `auth.uid()`.

## Verifying

Run `node scripts/verify-supabase.mjs` to check that the store row loads and the expected tables are reachable.
