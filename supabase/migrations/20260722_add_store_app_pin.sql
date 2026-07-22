-- Run once on an existing database. Fresh installs already include this in schema.sql.
-- Adds a store-wide app-lock PIN so the soft lock applies on every device (was
-- previously device-local). Non-destructive; existing stores keep no PIN (null).
alter table stores add column if not exists app_pin text;
