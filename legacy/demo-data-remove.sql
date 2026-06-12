-- REMOVE DEMO DATA: Run this in Supabase SQL Editor after demo
-- This removes all data for the default store but keeps the store and owner user

-- Delete shifts
DELETE FROM shifts WHERE store_id = '00000000-0000-0000-0000-000000000001';

-- Delete sales
DELETE FROM sales WHERE store_id = '00000000-0000-0000-0000-000000000001';

-- Delete cabinet positions
DELETE FROM cabinets WHERE store_id = '00000000-0000-0000-0000-000000000001';

-- Delete storage
DELETE FROM storage WHERE store_id = '00000000-0000-0000-0000-000000000001';

-- Delete flavors
DELETE FROM flavors WHERE store_id = '00000000-0000-0000-0000-000000000001';

-- Delete workers (this will also delete linked users via cascade)
DELETE FROM workers WHERE store_id = '00000000-0000-0000-0000-000000000001';

-- Delete non-owner users for this store
DELETE FROM store_users 
WHERE store_id = '00000000-0000-0000-0000-000000000001' 
AND role != 'owner';

SELECT 'Demo data removed!' as result;
