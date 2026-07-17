-- Run once on an existing v2 database. Fresh installs already include this in schema.sql.
create table if not exists inventory_products (
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

alter table inventory_products enable row level security;
drop policy if exists anon_all on inventory_products;
create policy anon_all on inventory_products for all to anon using (true) with check (true);
grant select, insert, update, delete on inventory_products to anon;
