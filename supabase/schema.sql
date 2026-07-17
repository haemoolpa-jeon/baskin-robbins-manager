-- ===========================================================================
-- BR 매장관리 v2 — schema (single store, no accounts/roles)
-- Run order: schema.sql → seed.sql  (Supabase → SQL Editor)
-- ===========================================================================

drop table if exists activity_log cascade;
drop table if exists sales cascade;
drop table if exists payroll_extras cascade;
drop table if exists shifts cascade;
drop table if exists storage cascade;
drop table if exists inventory_products cascade;
drop table if exists cabinets cascade;
drop table if exists workers cascade;
drop table if exists flavors cascade;
drop table if exists store_users cascade; -- removed in v2 (kept here to clean old installs)
drop table if exists users cascade;       -- removed in v2
drop table if exists stores cascade;

create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_par int default 2, -- 목표 재고: 맛별 유지 통 수 (주문 추천 기준)
  created_at timestamptz default now()
);

create table flavors (
  id bigint primary key, -- client-assigned (seed ids + Date.now() for custom)
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  color text default '#ff69b4',
  type text default 'fixed' check (type in ('fixed', 'seasonal', 'limited', 'special')),
  available boolean default true,
  lot_number text,
  expiry_date date,
  storage_location text not null default '',
  created_at timestamptz default now()
);

create table cabinets (
  id serial primary key,
  store_id uuid references stores(id) on delete cascade,
  cabinet_name text not null, -- cab1 | cab2
  row_name text not null,     -- top | bottom
  position int not null,      -- 0..15
  flavor_id bigint,
  level int default 100,      -- 0..100 (% remaining)
  unique (store_id, cabinet_name, row_name, position)
);

create table storage (
  id serial primary key,
  store_id uuid references stores(id) on delete cascade,
  flavor_id bigint not null,
  quantity int default 0,
  unique (store_id, flavor_id)
);

-- Cakes and packaged desserts are whole-unit inventory. They intentionally do
-- not share the flavor/storage model because each item has its own target and unit.
create table inventory_products (
  id bigint primary key,
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  category text not null check (category in ('cake', 'dessert', 'supply')),
  subtype text not null default 'other',
  quantity int not null default 0 check (quantity >= 0),
  par int not null default 2 check (par >= 0),
  unit text not null default '개',
  size_label text not null default '',
  location text not null default '',
  expiry_date date,
  pack_size int check (pack_size is null or pack_size > 0),
  available boolean default true,
  created_at timestamptz default now()
);

create table workers (
  id bigint generated always as identity primary key,
  store_id uuid references stores(id) on delete cascade,
  name text not null,
  emoji text default '👤',
  wage int default 10320,            -- 2026 최저시급
  tax_withholding boolean default true, -- 사업소득세 3.3% 적용 여부
  created_at timestamptz default now()
);

-- Shifts keyed by the real calendar date; minutes-from-midnight so half-hours survive.
create table shifts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  worker_id bigint references workers(id) on delete cascade,
  work_date date not null,
  start_min int not null,
  end_min int not null check (end_min > start_min),
  unique (store_id, worker_id, work_date, start_min)
);

-- 초과/기타(C) — manual per-worker, per-month payroll adjustment.
create table payroll_extras (
  id serial primary key,
  store_id uuid references stores(id) on delete cascade,
  worker_id bigint references workers(id) on delete cascade,
  year_month text not null, -- 'YYYY-MM'
  amount int default 0,
  note text default '',
  unique (store_id, worker_id, year_month)
);

-- Tub-consumption log (a replaced/emptied tub = one unit consumed).
create table sales (
  id serial primary key,
  store_id uuid references stores(id) on delete cascade,
  flavor_id bigint,
  quantity int default 1,
  sold_at timestamptz default now()
);

-- Change history — every meaningful action is logged here so the owner can
-- review what changed and when.
create table activity_log (
  id bigserial primary key,
  store_id uuid references stores(id) on delete cascade,
  category text not null,  -- 재고 | 근무 | 급여 | 주문 | 설정
  message text not null,
  created_at timestamptz default now()
);

create index on shifts (store_id, work_date);
create index on sales (store_id, sold_at);
create index on activity_log (store_id, created_at desc);

-- --- Row Level Security ----------------------------------------------------
-- No accounts in v2, so the public anon key is the only client identity. These
-- tables hold no credentials. (If you ever need true per-user protection,
-- switch to Supabase Auth and key policies to auth.uid().)
do $$
declare t text;
begin
  foreach t in array array['stores','flavors','cabinets','storage','inventory_products','workers','shifts','payroll_extras','sales','activity_log']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists anon_all on %I;', t);
    execute format('create policy anon_all on %I for all to anon using (true) with check (true);', t);
    execute format('grant select, insert, update, delete on %I to anon;', t);
  end loop;
end $$;

grant usage, select on all sequences in schema public to anon;
