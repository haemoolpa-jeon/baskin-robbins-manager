-- Run after 20260717_add_packaged_inventory.sql on databases that already have
-- the first cake/dessert implementation. This preserves all existing counts.
alter table inventory_products add column if not exists subtype text;
alter table inventory_products add column if not exists size_label text not null default '';
alter table inventory_products add column if not exists location text not null default '';
alter table inventory_products add column if not exists expiry_date date;
alter table inventory_products add column if not exists pack_size int;

update inventory_products
set subtype = case
  when category = 'roll' then 'roll'
  when category = 'macaron' then 'macaron'
  when category = 'cake' then 'standard_cake'
  else coalesce(nullif(subtype, ''), 'other')
end;

update inventory_products set category = 'dessert' where category in ('roll', 'macaron');

alter table inventory_products drop constraint if exists inventory_products_category_check;
alter table inventory_products
  add constraint inventory_products_category_check check (category in ('cake', 'dessert', 'supply'));
alter table inventory_products alter column subtype set default 'other';
update inventory_products set subtype = 'other' where subtype is null;
alter table inventory_products alter column subtype set not null;
alter table inventory_products drop constraint if exists inventory_products_pack_size_check;
alter table inventory_products
  add constraint inventory_products_pack_size_check check (pack_size is null or pack_size > 0);

alter table flavors add column if not exists lot_number text;
alter table flavors add column if not exists expiry_date date;
alter table flavors add column if not exists storage_location text not null default '';
