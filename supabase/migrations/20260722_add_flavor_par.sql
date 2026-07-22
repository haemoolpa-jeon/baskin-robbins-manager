-- Run once on an existing database. Fresh installs already include this in schema.sql.
-- Per-flavor ice-cream target (통). Null falls back to the store default (stores.default_par).
alter table flavors add column if not exists par int;
