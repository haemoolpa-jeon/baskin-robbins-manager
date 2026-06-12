-- Run this ONCE in Supabase SQL Editor to clear everything and setup fresh

-- Drop ALL tables in public schema
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Create tables
CREATE TABLE stores (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, pin TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE flavors (id BIGINT PRIMARY KEY, store_id UUID REFERENCES stores(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT DEFAULT '#ff69b4', type TEXT DEFAULT 'fixed', available BOOLEAN DEFAULT true);
CREATE TABLE cabinets (id SERIAL PRIMARY KEY, store_id UUID REFERENCES stores(id) ON DELETE CASCADE, cabinet_name TEXT NOT NULL, row_name TEXT NOT NULL, position INT NOT NULL, flavor_id BIGINT, level INT DEFAULT 100, UNIQUE(store_id, cabinet_name, row_name, position));
CREATE TABLE storage (id SERIAL PRIMARY KEY, store_id UUID REFERENCES stores(id) ON DELETE CASCADE, flavor_id BIGINT NOT NULL, quantity INT DEFAULT 0, UNIQUE(store_id, flavor_id));
CREATE TABLE workers (id BIGINT PRIMARY KEY, store_id UUID REFERENCES stores(id) ON DELETE CASCADE, name TEXT NOT NULL, emoji TEXT DEFAULT '👨', wage INT DEFAULT 10030);
CREATE TABLE shifts (id SERIAL PRIMARY KEY, store_id UUID REFERENCES stores(id) ON DELETE CASCADE, worker_id BIGINT REFERENCES workers(id) ON DELETE CASCADE, day_of_week INT NOT NULL, start_hour INT NOT NULL, end_hour INT NOT NULL);
CREATE TABLE sales (id SERIAL PRIMARY KEY, store_id UUID REFERENCES stores(id) ON DELETE CASCADE, flavor_id BIGINT, quantity INT DEFAULT 1, sold_at TIMESTAMPTZ DEFAULT NOW());

-- Enable RLS & policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON stores FOR ALL USING (true);
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON flavors FOR ALL USING (true);
ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON cabinets FOR ALL USING (true);
ALTER TABLE storage ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON storage FOR ALL USING (true);
ALTER TABLE workers ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON workers FOR ALL USING (true);
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON shifts FOR ALL USING (true);
ALTER TABLE sales ENABLE ROW LEVEL SECURITY; CREATE POLICY "all" ON sales FOR ALL USING (true);

-- Default store
INSERT INTO stores (id, name, pin) VALUES ('00000000-0000-0000-0000-000000000001', 'BR매장', '1234');
