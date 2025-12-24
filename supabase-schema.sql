-- Supabase SQL Schema for BR Store Manager
-- Run this in Supabase SQL Editor

-- Store info (for multi-store support later)
CREATE TABLE stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT, -- simple 4-digit PIN for access
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flavors
CREATE TABLE flavors (
    id BIGINT PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#ff69b4',
    type TEXT DEFAULT 'fixed', -- fixed, seasonal, limited, special
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cabinet positions
CREATE TABLE cabinets (
    id SERIAL PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    cabinet_name TEXT NOT NULL, -- cab1, cab2
    row_name TEXT NOT NULL, -- top, bottom
    position INT NOT NULL, -- 0-15
    flavor_id BIGINT,
    level INT DEFAULT 100, -- 0-100%
    UNIQUE(store_id, cabinet_name, row_name, position)
);

-- Storage inventory
CREATE TABLE storage (
    id SERIAL PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    flavor_id BIGINT NOT NULL,
    quantity INT DEFAULT 0,
    UNIQUE(store_id, flavor_id)
);

-- Workers
CREATE TABLE workers (
    id BIGINT PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '👨',
    wage INT DEFAULT 10030,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker shifts
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    worker_id BIGINT REFERENCES workers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 0=Sun, 6=Sat
    start_hour INT NOT NULL,
    end_hour INT NOT NULL
);

-- Sales records
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    flavor_id BIGINT,
    quantity INT DEFAULT 1,
    sold_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now - can restrict later with auth)
CREATE POLICY "Allow all" ON stores FOR ALL USING (true);
CREATE POLICY "Allow all" ON flavors FOR ALL USING (true);
CREATE POLICY "Allow all" ON cabinets FOR ALL USING (true);
CREATE POLICY "Allow all" ON storage FOR ALL USING (true);
CREATE POLICY "Allow all" ON workers FOR ALL USING (true);
CREATE POLICY "Allow all" ON shifts FOR ALL USING (true);
CREATE POLICY "Allow all" ON sales FOR ALL USING (true);

-- Create a default store
INSERT INTO stores (id, name, pin) VALUES 
    ('00000000-0000-0000-0000-000000000001', '우리매장', '1234');
