-- Run once on an existing database. Fresh installs already include this in schema.sql.
-- Adds daily inventory snapshots (point-in-time on-hand quantities) so the app can
-- show "how many did I have on day X" and restore a past day. Non-destructive.
create table if not exists inventory_snapshots (
  id bigserial primary key,
  store_id uuid references stores(id) on delete cascade,
  snapshot_date date not null,
  item_type text not null check (item_type in ('storage', 'product')),
  item_id bigint not null,
  quantity int not null default 0 check (quantity >= 0),
  created_at timestamptz default now(),
  unique (store_id, snapshot_date, item_type, item_id)
);
create index if not exists inventory_snapshots_store_date_idx
  on inventory_snapshots (store_id, snapshot_date);

alter table inventory_snapshots enable row level security;
drop policy if exists anon_all on inventory_snapshots;
create policy anon_all on inventory_snapshots for all to anon using (true) with check (true);
grant select, insert, update, delete on inventory_snapshots to anon;
grant usage, select on sequence inventory_snapshots_id_seq to anon;
