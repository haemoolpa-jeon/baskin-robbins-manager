-- Run this in Supabase SQL Editor to add user/role system

-- Users table (linked to workers for parttime)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    pin TEXT NOT NULL, -- 4-6 digit PIN for simple login
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'parttime')),
    worker_id BIGINT REFERENCES workers(id) ON DELETE SET NULL, -- for parttime linking
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store-User relationship (for multi-store owners/managers)
CREATE TABLE store_users (
    id SERIAL PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'parttime')),
    UNIQUE(store_id, user_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "all" ON users FOR ALL USING (true);
CREATE POLICY "all" ON store_users FOR ALL USING (true);

-- Create default owner account (PIN: 0000)
INSERT INTO users (id, pin, name, role) VALUES 
    ('00000000-0000-0000-0000-000000000002', '0000', '점주', 'owner');

-- Link owner to default store
INSERT INTO store_users (store_id, user_id, role) VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'owner');
