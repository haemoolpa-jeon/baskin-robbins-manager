// Supabase Configuration
const SUPABASE_URL = 'https://tcbrbdrotxklziqpvqup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjYnJiZHJvdHhrbHppcXB2cXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNjQwNDQsImV4cCI6MjA4MTk0MDA0NH0.Pn3lqiGKRTqZprB4vNiCkrTi0V-bfNxRl-hXZVQBY18';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Default store ID (single store mode)
let STORE_ID = localStorage.getItem('br_store_id') || '00000000-0000-0000-0000-000000000001';

// Sync status
let syncStatus = 'offline';
let lastSync = null;

// Check connection and sync
async function initSupabase() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.log('Supabase not configured - using localStorage only');
        syncStatus = 'local';
        updateSyncUI();
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient.from('stores').select('id').limit(1);
        if (error) throw error;
        syncStatus = 'online';
        updateSyncUI();
        return true;
    } catch (e) {
        console.error('Supabase connection failed:', e);
        syncStatus = 'offline';
        updateSyncUI();
        return false;
    }
}

function updateSyncUI() {
    const el = document.getElementById('sync-status');
    if (!el) return;
    const icons = { online: '☁️', offline: '📴', syncing: '🔄', local: '💾' };
    const labels = { online: '동기화됨', offline: '오프라인', syncing: '동기화중...', local: '로컬저장' };
    el.innerHTML = `${icons[syncStatus]} ${labels[syncStatus]}`;
    el.className = `sync-status ${syncStatus}`;
}

// ===== DATA SYNC FUNCTIONS =====

async function syncToCloud() {
    if (syncStatus === 'local' || syncStatus === 'offline') return;
    
    syncStatus = 'syncing';
    updateSyncUI();
    
    try {
        // Sync flavors
        const flavorsData = store.flavors.map(f => ({
            id: f.id,
            store_id: STORE_ID,
            name: f.name,
            color: f.color,
            type: f.type || 'fixed',
            available: f.available !== false
        }));
        await supabaseClient.from('flavors').upsert(flavorsData, { onConflict: 'id' });
        
        // Sync cabinets
        const cabinetData = [];
        ['cab1', 'cab2'].forEach(cabName => {
            ['top', 'bottom'].forEach(rowName => {
                const row = store.cabinets[cabName]?.[rowName] || [];
                row.forEach((slot, pos) => {
                    cabinetData.push({
                        store_id: STORE_ID,
                        cabinet_name: cabName,
                        row_name: rowName,
                        position: pos,
                        flavor_id: slot?.flavorId || null,
                        level: slot?.level || null
                    });
                });
            });
        });
        await supabaseClient.from('cabinets').upsert(cabinetData, { 
            onConflict: 'store_id,cabinet_name,row_name,position' 
        });
        
        // Sync storage
        const storageData = Object.entries(store.storage).map(([flavorId, qty]) => ({
            store_id: STORE_ID,
            flavor_id: parseInt(flavorId),
            quantity: qty
        }));
        if (storageData.length > 0) {
            await supabaseClient.from('storage').upsert(storageData, { 
                onConflict: 'store_id,flavor_id' 
            });
        }
        
        // Sync workers
        const workersData = store.workers.map(w => ({
            id: w.id,
            store_id: STORE_ID,
            name: w.name,
            emoji: w.emoji,
            wage: w.wage
        }));
        await supabaseClient.from('workers').upsert(workersData, { onConflict: 'id' });
        
        // Sync shifts (delete and re-insert)
        await supabaseClient.from('shifts').delete().eq('store_id', STORE_ID);
        const shiftsData = [];
        store.workers.forEach(w => {
            Object.entries(w.shifts || {}).forEach(([day, dayShifts]) => {
                dayShifts.forEach(s => {
                    shiftsData.push({
                        store_id: STORE_ID,
                        worker_id: w.id,
                        day_of_week: parseInt(day),
                        start_hour: s.start,
                        end_hour: s.end
                    });
                });
            });
        });
        if (shiftsData.length > 0) {
            await supabaseClient.from('shifts').insert(shiftsData);
        }
        
        lastSync = new Date();
        syncStatus = 'online';
        updateSyncUI();
        
    } catch (e) {
        console.error('Sync failed:', e);
        syncStatus = 'offline';
        updateSyncUI();
    }
}

async function loadFromCloud() {
    if (syncStatus === 'local') return false;
    
    try {
        // Load flavors
        const { data: flavors } = await supabaseClient
            .from('flavors')
            .select('*')
            .eq('store_id', STORE_ID);
        
        if (flavors && flavors.length > 0) {
            store.flavors = flavors.map(f => ({
                id: f.id,
                name: f.name,
                color: f.color,
                type: f.type,
                available: f.available
            }));
        }
        
        // Load cabinets
        const { data: cabinets } = await supabaseClient
            .from('cabinets')
            .select('*')
            .eq('store_id', STORE_ID);
        
        if (cabinets) {
            store.cabinets = { cab1: { top: Array(16).fill(null), bottom: Array(16).fill(null) },
                              cab2: { top: Array(16).fill(null), bottom: Array(16).fill(null) } };
            cabinets.forEach(c => {
                if (c.flavor_id) {
                    store.cabinets[c.cabinet_name][c.row_name][c.position] = {
                        flavorId: c.flavor_id,
                        level: c.level
                    };
                }
            });
        }
        
        // Load storage
        const { data: storageData } = await supabaseClient
            .from('storage')
            .select('*')
            .eq('store_id', STORE_ID);
        
        if (storageData) {
            store.storage = {};
            storageData.forEach(s => {
                store.storage[s.flavor_id] = s.quantity;
            });
        }
        
        // Load workers
        const { data: workers } = await supabaseClient
            .from('workers')
            .select('*')
            .eq('store_id', STORE_ID);
        
        // Load shifts
        const { data: shifts } = await supabaseClient
            .from('shifts')
            .select('*')
            .eq('store_id', STORE_ID);
        
        if (workers) {
            store.workers = workers.map(w => {
                const workerShifts = {};
                shifts?.filter(s => s.worker_id === w.id).forEach(s => {
                    if (!workerShifts[s.day_of_week]) workerShifts[s.day_of_week] = [];
                    workerShifts[s.day_of_week].push({ start: s.start_hour, end: s.end_hour });
                });
                return {
                    id: w.id,
                    name: w.name,
                    emoji: w.emoji,
                    wage: w.wage,
                    shifts: workerShifts
                };
            });
        }
        
        // Load sales
        const { data: sales } = await supabaseClient
            .from('sales')
            .select('*')
            .eq('store_id', STORE_ID);
        
        if (sales) {
            store.sales = sales.map(s => ({
                flavorId: s.flavor_id,
                qty: s.quantity,
                date: new Date(s.sold_at).getTime()
            }));
        }
        
        // Save to localStorage as backup
        saveLocal();
        
        syncStatus = 'online';
        updateSyncUI();
        return true;
        
    } catch (e) {
        console.error('Load from cloud failed:', e);
        syncStatus = 'offline';
        updateSyncUI();
        return false;
    }
}

// Save to localStorage (backup)
function saveLocal() {
    localStorage.setItem('br_flavors3', JSON.stringify(store.flavors));
    localStorage.setItem('br_cabinets', JSON.stringify(store.cabinets));
    localStorage.setItem('br_storage', JSON.stringify(store.storage));
    localStorage.setItem('br_workers', JSON.stringify(store.workers));
    localStorage.setItem('br_sales', JSON.stringify(store.sales));
}

// Debounced sync
let syncTimeout = null;
function debouncedSync() {
    saveLocal();
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(syncToCloud, 2000); // Sync after 2s of inactivity
}

// Override the save function
const originalSave = typeof save === 'function' ? save : null;
window.save = function() {
    debouncedSync();
};
