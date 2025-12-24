// Data Store - Cabinet Layout: 2 cabinets × 32 positions (16 top + 16 bottom)
// Flavor types: fixed(상시), seasonal(시즌), limited(한정), special(스페셜)
const defaultFlavors = [
    // 상시 (Fixed)
    {id:1,name:'엄마는외계인',color:'#9c27b0',type:'fixed'},
    {id:2,name:'민트초코칩',color:'#3eb489',type:'fixed'},
    {id:3,name:'바닐라',color:'#fff8dc',type:'fixed'},
    {id:4,name:'초콜릿',color:'#5d4037',type:'fixed'},
    {id:5,name:'딸기',color:'#e91e63',type:'fixed'},
    {id:6,name:'레인보우샤베트',color:'#ff9800',type:'fixed'},
    {id:7,name:'아몬드봉봉',color:'#d4a574',type:'fixed'},
    {id:8,name:'체리쥬빌레',color:'#c62828',type:'fixed'},
    {id:9,name:'뉴욕치즈케이크',color:'#ffd54f',type:'fixed'},
    {id:10,name:'슈팅스타',color:'#7c4dff',type:'fixed'},
    {id:11,name:'자모카아몬드훠지',color:'#6d4c41',type:'fixed'},
    {id:12,name:'피스타치오아몬드',color:'#aed581',type:'fixed'},
    {id:13,name:'오레오쿠키앤크림',color:'#424242',type:'fixed'},
    {id:14,name:'사랑에빠진딸기',color:'#f48fb1',type:'fixed'},
    {id:15,name:'31요거트',color:'#fff9c4',type:'fixed'},
    {id:16,name:'이상한나라의솜사탕',color:'#ce93d8',type:'fixed'},
    {id:17,name:'베리베리스트로베리',color:'#ef5350',type:'fixed'},
    {id:18,name:'초코나무숲',color:'#4e342e',type:'fixed'},
    {id:19,name:'망고탱고',color:'#ffb74d',type:'fixed'},
    {id:20,name:'그린티',color:'#81c784',type:'fixed'},
    {id:21,name:'애플민트',color:'#80cbc4',type:'fixed'},
    {id:22,name:'바람과함께사라지다',color:'#90caf9',type:'fixed'},
    {id:23,name:'쿠키앤크림',color:'#9e9e9e',type:'fixed'},
    {id:24,name:'월넛',color:'#8d6e63',type:'fixed'},
    {id:25,name:'블루베리치즈케이크',color:'#7986cb',type:'fixed'},
    {id:26,name:'카라멜프랄린',color:'#ffab91',type:'fixed'},
    {id:27,name:'초콜릿무스',color:'#5d4037',type:'fixed'},
    {id:28,name:'팥',color:'#8e3a59',type:'fixed'},
    {id:29,name:'찰떡아이스',color:'#ffccbc',type:'fixed'},
    {id:30,name:'티라미수',color:'#a1887f',type:'fixed'},
    // 시즌 (Seasonal)
    {id:101,name:'눈꽃빙수',color:'#e3f2fd',type:'seasonal',available:true},
    {id:102,name:'수박바',color:'#ef5350',type:'seasonal',available:true},
    {id:103,name:'메론',color:'#c5e1a5',type:'seasonal',available:true},
    {id:104,name:'복숭아',color:'#ffab91',type:'seasonal',available:true},
    {id:105,name:'고구마',color:'#9c27b0',type:'seasonal',available:false},
    {id:106,name:'호박',color:'#ff9800',type:'seasonal',available:false},
    {id:107,name:'크리스마스민트',color:'#4caf50',type:'seasonal',available:true},
    {id:108,name:'산타의선물',color:'#f44336',type:'seasonal',available:true},
    // 한정 (Limited)
    {id:201,name:'BTS다이너마이트',color:'#9c27b0',type:'limited',available:false},
    {id:202,name:'핑크스타',color:'#f06292',type:'limited',available:true},
    {id:203,name:'골든초코볼',color:'#ffc107',type:'limited',available:true},
    // 스페셜 (Special)
    {id:301,name:'쫀득초코브라우니',color:'#4e342e',type:'special'},
    {id:302,name:'트리플치즈케이크',color:'#ffe082',type:'special'},
    {id:303,name:'스트로베리딜라이트',color:'#e91e63',type:'special'},
];

const store = {
    flavors: JSON.parse(localStorage.getItem('br_flavors3')) || defaultFlavors,
    cabinets: JSON.parse(localStorage.getItem('br_cabinets')) || {
        cab1: { top: Array(16).fill(null), bottom: Array(16).fill(null) },
        cab2: { top: Array(16).fill(null), bottom: Array(16).fill(null) }
    },
    storage: JSON.parse(localStorage.getItem('br_storage')) || {},
    workers: JSON.parse(localStorage.getItem('br_workers')) || [
        {id:1,name:'김민수',emoji:'👨',wage:10030,schedule:[{day:1,hours:5},{day:3,hours:5},{day:5,hours:6}]},
        {id:2,name:'이지은',emoji:'👩',wage:10030,schedule:[{day:2,hours:4},{day:4,hours:4},{day:6,hours:8}]},
    ],
    sales: JSON.parse(localStorage.getItem('br_sales')) || [],
    currentCab: 'cab1',
    viewMode: 'cabinet'
};

// Initialize some sample positions
if(!localStorage.getItem('br_cabinets')) {
    store.cabinets.cab1.top[0] = {flavorId:1,level:80};
    store.cabinets.cab1.top[1] = {flavorId:2,level:60};
    store.cabinets.cab1.top[2] = {flavorId:3,level:90};
    store.cabinets.cab1.top[3] = {flavorId:4,level:40};
    store.cabinets.cab1.bottom[0] = {flavorId:1,level:100};
    store.cabinets.cab1.bottom[1] = {flavorId:2,level:100};
    store.cabinets.cab2.top[0] = {flavorId:5,level:70};
    store.cabinets.cab2.top[1] = {flavorId:6,level:50};
    store.storage = {1:3,2:4,3:2,4:3,5:2,6:1};
}

const typeLabels = {fixed:'🔵 상시',seasonal:'🟠 시즌',limited:'🔴 한정',special:'🟣 스페셜'};
const typeOrder = ['fixed','seasonal','limited','special'];

const save = () => {
    localStorage.setItem('br_flavors3', JSON.stringify(store.flavors));
    localStorage.setItem('br_cabinets', JSON.stringify(store.cabinets));
    localStorage.setItem('br_storage', JSON.stringify(store.storage));
    localStorage.setItem('br_workers', JSON.stringify(store.workers));
    localStorage.setItem('br_sales', JSON.stringify(store.sales));
};

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.page).classList.add('active');
    };
});

// ===== INVENTORY =====
function getFlavor(id) { return store.flavors.find(f => f.id === id); }

function countTubs() {
    let display = 0, waiting = 0, storage = 0;
    ['cab1','cab2'].forEach(c => {
        store.cabinets[c].top.forEach(t => { if(t) display++; });
        store.cabinets[c].bottom.forEach(t => { if(t) waiting++; });
    });
    Object.values(store.storage).forEach(n => storage += n);
    return {display, waiting, storage, total: display + waiting + storage};
}

function renderInventory() {
    const counts = countTubs();
    const cab = store.cabinets[store.currentCab];
    
    document.getElementById('inventory').innerHTML = `
        <h1 class="page-title">🍨 재고 관리</h1>
        
        <!-- Summary -->
        <div class="inv-summary">
            <div class="sum-item"><span class="sum-icon">🔝</span><span class="sum-val">${counts.display}/32</span><span class="sum-lbl">진열중</span></div>
            <div class="sum-item"><span class="sum-icon">⬇️</span><span class="sum-val">${counts.waiting}/32</span><span class="sum-lbl">대기</span></div>
            <div class="sum-item"><span class="sum-icon">📦</span><span class="sum-val">${counts.storage}</span><span class="sum-lbl">창고</span></div>
        </div>

        <!-- Cabinet Tabs -->
        <div class="cab-tabs">
            <button class="cab-tab ${store.currentCab==='cab1'?'active':''}" data-cab="cab1">캐비닛 1</button>
            <button class="cab-tab ${store.currentCab==='cab2'?'active':''}" data-cab="cab2">캐비닛 2</button>
            <button class="cab-tab storage-tab" data-cab="storage">📦 창고</button>
        </div>

        ${store.currentCab === 'storage' ? renderStorageView() : `
        <!-- Cabinet View -->
        <div class="cabinet">
            <div class="cab-section">
                <div class="cab-label">🔝 진열중 (위)</div>
                <div class="cab-grid top">
                    ${cab.top.map((slot,i) => renderSlot(slot, 'top', i)).join('')}
                </div>
            </div>
            <div class="cab-divider"></div>
            <div class="cab-section">
                <div class="cab-label">⬇️ 대기 (아래)</div>
                <div class="cab-grid bottom">
                    ${cab.bottom.map((slot,i) => renderSlot(slot, 'bottom', i)).join('')}
                </div>
            </div>
        </div>
        `}
    `;
    
    document.querySelectorAll('.cab-tab').forEach(t => {
        t.onclick = () => { store.currentCab = t.dataset.cab; store.storageSearch = ''; renderInventory(); };
    });
    document.querySelectorAll('.slot').forEach(s => {
        s.onclick = () => showSlotModal(s.dataset.row, +s.dataset.idx);
    });
    initDragDrop();
    document.querySelectorAll('.storage-item[data-id]').forEach(s => {
        s.onclick = () => showStorageItemModal(+s.dataset.id);
    });
    const searchInput = document.getElementById('storageSearchInput');
    if(searchInput) {
        searchInput.oninput = (e) => { store.storageSearch = e.target.value; renderInventory(); };
    }
    const addBtn = document.getElementById('addFlavorBtn');
    if(addBtn) addBtn.onclick = showAddFlavorModal;
}

function renderSlot(slot, row, idx) {
    if(!slot) {
        return `<div class="slot empty" data-row="${row}" data-idx="${idx}" draggable="false">
            <div class="slot-empty">+</div>
        </div>`;
    }
    const f = getFlavor(slot.flavorId);
    const levelClass = slot.level <= 20 ? 'critical' : slot.level <= 50 ? 'low' : '';
    return `<div class="slot filled ${levelClass}" data-row="${row}" data-idx="${idx}" draggable="true" style="--color:${f?.color||'#ccc'}">
        <div class="slot-tub">🍨</div>
        <div class="slot-level"><div class="level-fill" style="height:${slot.level}%"></div></div>
        <div class="slot-name">${f?.name?.slice(0,4)||'?'}</div>
        <div class="slot-pct">${slot.level}%</div>
    </div>`;
}

// Drag & Drop
let dragData = null;

function initDragDrop() {
    document.querySelectorAll('.slot.filled').forEach(el => {
        el.addEventListener('dragstart', e => {
            dragData = { row: el.dataset.row, idx: +el.dataset.idx };
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over'));
        });
        // Touch support
        el.addEventListener('touchstart', handleTouchStart, {passive: false});
        el.addEventListener('touchmove', handleTouchMove, {passive: false});
        el.addEventListener('touchend', handleTouchEnd);
    });
    document.querySelectorAll('.slot').forEach(el => {
        el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
        el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
        el.addEventListener('drop', e => {
            e.preventDefault();
            el.classList.remove('drag-over');
            if(!dragData) return;
            swapSlots(dragData.row, dragData.idx, el.dataset.row, +el.dataset.idx);
            dragData = null;
        });
    });
}

let touchDragEl = null, touchClone = null;
function handleTouchStart(e) {
    const el = e.currentTarget;
    dragData = { row: el.dataset.row, idx: +el.dataset.idx };
    touchDragEl = el;
    // Long press to start drag
    el._touchTimer = setTimeout(() => {
        el.classList.add('dragging');
        touchClone = el.cloneNode(true);
        touchClone.classList.add('touch-clone');
        document.body.appendChild(touchClone);
        moveTouchClone(e.touches[0]);
    }, 200);
}
function handleTouchMove(e) {
    if(!touchClone) { clearTimeout(touchDragEl?._touchTimer); return; }
    e.preventDefault();
    moveTouchClone(e.touches[0]);
    const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)?.closest('.slot');
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over'));
    if(target) target.classList.add('drag-over');
}
function handleTouchEnd(e) {
    clearTimeout(touchDragEl?._touchTimer);
    if(touchClone) {
        const target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)?.closest('.slot');
        if(target && dragData) swapSlots(dragData.row, dragData.idx, target.dataset.row, +target.dataset.idx);
        touchClone.remove();
        touchClone = null;
    }
    touchDragEl?.classList.remove('dragging');
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over'));
    dragData = null; touchDragEl = null;
}
function moveTouchClone(touch) {
    if(!touchClone) return;
    touchClone.style.left = touch.clientX - 25 + 'px';
    touchClone.style.top = touch.clientY - 25 + 'px';
}

function swapSlots(fromRow, fromIdx, toRow, toIdx) {
    const cab = store.cabinets[store.currentCab];
    const temp = cab[fromRow][fromIdx];
    cab[fromRow][fromIdx] = cab[toRow][toIdx];
    cab[toRow][toIdx] = temp;
    save();
    renderInventory();
}

function renderStorageView() {
    const q = (store.storageSearch || '').toLowerCase();
    const filtered = store.flavors.filter(f => !q || f.name.toLowerCase().includes(q));
    const grouped = {};
    typeOrder.forEach(t => grouped[t] = []);
    filtered.forEach(f => grouped[f.type || 'fixed'].push(f));
    
    let itemsHtml = '';
    typeOrder.forEach(type => {
        if(grouped[type].length === 0) return;
        itemsHtml += `<div class="storage-section">${typeLabels[type]}</div>`;
        grouped[type].forEach(f => {
            const count = store.storage[f.id] || 0;
            const unavail = f.available === false;
            itemsHtml += `<div class="storage-item ${unavail ? 'unavailable' : ''}" data-id="${f.id}">
                <div class="storage-tub" style="text-shadow:0 0 10px ${f.color}">🍨</div>
                <div class="storage-name">${f.name}</div>
                <div class="storage-count">${count}통</div>
                ${unavail ? '<div class="storage-badge">판매중지</div>' : ''}
            </div>`;
        });
    });
    
    return `
        <input type="text" class="storage-search" placeholder="🔍 맛 검색..." value="${store.storageSearch || ''}" id="storageSearchInput">
        <div class="storage-grid">
            ${itemsHtml}
            <div class="storage-item add-item" id="addFlavorBtn">
                <div class="add-icon">+</div>
                <div class="storage-name">새 맛 추가</div>
            </div>
        </div>
    `;
}

function showSlotModal(row, idx) {
    const cab = store.cabinets[store.currentCab];
    const slot = cab[row][idx];
    const posLabel = `${store.currentCab === 'cab1' ? '캐비닛1' : '캐비닛2'} ${row === 'top' ? '위' : '아래'} ${idx + 1}번`;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    
    if(!slot) {
        // Empty slot - assign flavor with search
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-title">📍 ${posLabel}</div>
                <input type="text" class="flavor-search" placeholder="🔍 맛 검색...">
                <div class="type-tabs">
                    <button class="type-tab active" data-type="all">전체</button>
                    <button class="type-tab" data-type="fixed">🔵상시</button>
                    <button class="type-tab" data-type="seasonal">🟠시즌</button>
                    <button class="type-tab" data-type="limited">🔴한정</button>
                    <button class="type-tab" data-type="special">🟣스페셜</button>
                </div>
                <div class="flavor-select"></div>
                <div class="modal-actions">
                    <button class="modal-btn cancel">취소</button>
                </div>
            </div>
        `;
        
        const searchInput = modal.querySelector('.flavor-search');
        const flavorList = modal.querySelector('.flavor-select');
        let currentType = 'all';
        
        const renderFlavorList = () => {
            const query = searchInput.value.toLowerCase();
            const filtered = store.flavors.filter(f => {
                if(f.available === false) return false; // Hide unavailable
                if(currentType !== 'all' && f.type !== currentType) return false;
                if(query && !f.name.toLowerCase().includes(query)) return false;
                return true;
            });
            
            // Group by type
            const grouped = {};
            typeOrder.forEach(t => grouped[t] = []);
            filtered.forEach(f => grouped[f.type || 'fixed'].push(f));
            
            let html = '';
            typeOrder.forEach(type => {
                if(grouped[type].length === 0) return;
                if(currentType === 'all') {
                    html += `<div class="type-section">${typeLabels[type]}</div>`;
                }
                grouped[type].forEach(f => {
                    html += `<button class="flv-btn" data-id="${f.id}" style="--color:${f.color}">
                        <span class="flv-icon">🍨</span>
                        <span class="flv-name">${f.name}</span>
                        <span class="flv-stock">창고: ${store.storage[f.id]||0}</span>
                    </button>`;
                });
            });
            flavorList.innerHTML = html || '<div class="no-result">검색 결과 없음</div>';
            
            flavorList.querySelectorAll('.flv-btn').forEach(b => {
                b.onclick = () => {
                    const fid = +b.dataset.id;
                    cab[row][idx] = {flavorId: fid, level: 100};
                    if(store.storage[fid] > 0) store.storage[fid]--;
                    save(); modal.remove(); renderInventory();
                };
            });
        };
        
        searchInput.oninput = renderFlavorList;
        modal.querySelectorAll('.type-tab').forEach(t => {
            t.onclick = () => {
                modal.querySelectorAll('.type-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                currentType = t.dataset.type;
                renderFlavorList();
            };
        });
        renderFlavorList();
    } else {
        // Filled slot - adjust level or replace
        const f = getFlavor(slot.flavorId);
        let level = slot.level;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-title" style="text-shadow:0 0 15px ${f?.color}">🍨 ${f?.name}</div>
                <div class="modal-subtitle">📍 ${posLabel}</div>
                
                <div class="level-control">
                    <div class="level-label">남은 양</div>
                    <div class="level-bar-big">
                        <div class="level-fill-big" style="width:${level}%"></div>
                    </div>
                    <div class="level-btns">
                        <button class="lvl-btn" data-v="0">0%</button>
                        <button class="lvl-btn" data-v="25">25%</button>
                        <button class="lvl-btn" data-v="50">50%</button>
                        <button class="lvl-btn" data-v="75">75%</button>
                        <button class="lvl-btn" data-v="100">100%</button>
                    </div>
                    <input type="range" class="level-slider" min="0" max="100" value="${level}">
                    <div class="level-value">${level}%</div>
                </div>

                <div class="slot-actions">
                    <button class="action-btn replace">🔄 교체 (새 통)</button>
                    <button class="action-btn remove">🗑️ 비우기</button>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-btn cancel">취소</button>
                    <button class="modal-btn confirm">저장</button>
                </div>
            </div>
        `;
        
        const slider = modal.querySelector('.level-slider');
        const valDisp = modal.querySelector('.level-value');
        const fillBar = modal.querySelector('.level-fill-big');
        
        const updateLevel = (v) => {
            level = v;
            slider.value = v;
            valDisp.textContent = v + '%';
            fillBar.style.width = v + '%';
        };
        
        slider.oninput = () => updateLevel(+slider.value);
        modal.querySelectorAll('.lvl-btn').forEach(b => {
            b.onclick = () => updateLevel(+b.dataset.v);
        });
        
        modal.querySelector('.replace').onclick = () => {
            if(slot.level < 100) {
                store.sales.push({flavorId: slot.flavorId, qty: 1, date: Date.now()});
            }
            slot.level = 100;
            if(store.storage[slot.flavorId] > 0) store.storage[slot.flavorId]--;
            save(); modal.remove(); renderInventory();
        };
        
        modal.querySelector('.remove').onclick = () => {
            cab[row][idx] = null;
            save(); modal.remove(); renderInventory();
        };
        
        modal.querySelector('.confirm').onclick = () => {
            slot.level = level;
            save(); modal.remove(); renderInventory();
        };
    }
    
    document.body.appendChild(modal);
    modal.querySelector('.cancel').onclick = () => modal.remove();
}

function showStorageItemModal(flavorId) {
    const f = getFlavor(flavorId);
    if(!f) return;
    let count = store.storage[flavorId] || 0;
    const isUnavailable = f.available === false;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title" style="text-shadow:0 0 15px ${f.color}">🍨 ${f.name}</div>
            <div class="modal-subtitle">${typeLabels[f.type || 'fixed']} ${isUnavailable ? '· 🚫 판매중지' : ''}</div>
            
            <div class="storage-modal-section">
                <div class="section-label">📦 창고 재고</div>
                <div class="qty-control">
                    <button class="qty-btn minus">−</button>
                    <span class="qty-display">${count}</span>
                    <button class="qty-btn plus">+</button>
                </div>
            </div>
            
            <div class="manage-actions">
                <button class="manage-action-btn toggle ${isUnavailable ? 'off' : 'on'}">
                    ${isUnavailable ? '🚫 판매중지 상태' : '✅ 판매중'}
                </button>
                <button class="manage-action-btn delete">🗑️ 삭제</button>
            </div>
            
            <div class="modal-actions">
                <button class="modal-btn cancel">취소</button>
                <button class="modal-btn confirm">저장</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const qtyDisp = modal.querySelector('.qty-display');
    modal.querySelector('.minus').onclick = () => { if(count>0) qtyDisp.textContent = --count; };
    modal.querySelector('.plus').onclick = () => qtyDisp.textContent = ++count;
    
    modal.querySelector('.toggle').onclick = () => {
        f.available = f.available === false ? true : false;
        save(); modal.remove(); renderInventory();
    };
    
    modal.querySelector('.delete').onclick = () => {
        if(confirm(`"${f.name}" 삭제하시겠습니까?`)) {
            store.flavors = store.flavors.filter(x => x.id !== f.id);
            delete store.storage[f.id];
            save(); modal.remove(); renderInventory();
        }
    };
    
    modal.querySelector('.cancel').onclick = () => modal.remove();
    modal.querySelector('.confirm').onclick = () => {
        store.storage[flavorId] = count;
        save(); modal.remove(); renderInventory();
    };
}

function showAddFlavorModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">🍨 새 맛 추가</div>
            <label>맛 이름</label>
            <input type="text" id="newName" placeholder="예: 슈팅스타">
            <label>종류</label>
            <div class="type-select">
                <button class="type-opt active" data-type="fixed">🔵 상시</button>
                <button class="type-opt" data-type="seasonal">🟠 시즌</button>
                <button class="type-opt" data-type="limited">🔴 한정</button>
                <button class="type-opt" data-type="special">🟣 스페셜</button>
            </div>
            <label>색상</label>
            <input type="color" id="newColor" value="#ff69b4">
            <label>창고 수량</label>
            <input type="number" id="newStorage" value="0" min="0">
            <div class="modal-actions">
                <button class="modal-btn cancel">취소</button>
                <button class="modal-btn confirm">추가</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    let selectedType = 'fixed';
    modal.querySelectorAll('.type-opt').forEach(b => {
        b.onclick = () => {
            modal.querySelectorAll('.type-opt').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            selectedType = b.dataset.type;
        };
    });
    modal.querySelector('.cancel').onclick = () => modal.remove();
    modal.querySelector('.confirm').onclick = () => {
        const name = modal.querySelector('#newName').value.trim();
        if(!name) return alert('이름을 입력하세요');
        const id = Date.now();
        store.flavors.push({ id, name, color: modal.querySelector('#newColor').value, type: selectedType });
        store.storage[id] = +modal.querySelector('#newStorage').value || 0;
        save(); modal.remove(); renderInventory();
    };
}

// ===== TIMESHEET =====
const SLOTS = []; // 30-min slots: 9, 9.5, 10, 10.5, ... 22
for(let h = 9; h <= 22; h++) { SLOTS.push(h); SLOTS.push(h + 0.5); }
SLOTS.pop(); // Remove 22.5, end at 22
const DAYS = ['일','월','화','수','목','금','토'];

// Week offset (0 = current week, -1 = last week, 1 = next week)
store.weekOffset = store.weekOffset || 0;

// Migrate old schedule format to new if needed
store.workers.forEach(w => {
    if(!w.shifts) w.shifts = {}; // {weekKey: {dayIndex: [{start:9, end:14.5}, ...]}}
});

function getWeekKey(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + (offset * 7) - d.getDay());
    return `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + 6) / 7)).padStart(2, '0')}`;
}

function getWeekDates(offset = 0) {
    const today = new Date();
    const day = today.getDay();
    const dates = [];
    for(let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - day + i + (offset * 7));
        dates.push(d);
    }
    return dates;
}

function formatSlot(slot) {
    const h = Math.floor(slot);
    const m = slot % 1 === 0.5 ? '30' : '00';
    return `${h}:${m}`;
}

function renderTimesheet() {
    const weekDates = getWeekDates(store.weekOffset);
    const weekKey = getWeekKey(store.weekOffset);
    const selectedDay = store.selectedDay ?? new Date().getDay();
    
    // Week label
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    const weekLabel = `${weekStart.getMonth()+1}/${weekStart.getDate()} - ${weekEnd.getMonth()+1}/${weekEnd.getDate()}`;
    const isCurrentWeek = store.weekOffset === 0;
    
    // Filter workers based on role
    let visibleWorkers = store.workers;
    const isViewOnly = typeof isParttime === 'function' && isParttime();
    if (isViewOnly && typeof currentUser !== 'undefined' && currentUser?.worker_id) {
        visibleWorkers = store.workers.filter(w => w.id === currentUser.worker_id);
    }
    
    const isFullAccess = typeof isOwner === 'function' ? (isOwner() || isManager()) : true;
    const canEdit = isFullAccess && !isViewOnly;
    
    // Calculate weekly stats for this week
    const weeklyStats = visibleWorkers.map(w => {
        let hours = 0;
        const weekShifts = w.shifts?.[weekKey] || {};
        Object.values(weekShifts).forEach(dayShifts => {
            dayShifts.forEach(s => hours += (s.end - s.start));
        });
        const basePay = Math.round(hours * w.wage);
        const bonus = hours >= 15 ? Math.floor((hours/40)*8*w.wage) : 0;
        return { ...w, hours, basePay, bonus, total: basePay + bonus, weekShifts };
    });

    // Format shift time
    const formatTime = (t) => `${Math.floor(t)}:${t % 1 === 0.5 ? '30' : '00'}`;
    const getShiftText = (shifts) => {
        if (!shifts || shifts.length === 0) return '휴무';
        return shifts.map(s => `${formatTime(s.start)}-${formatTime(s.end)}`).join(', ');
    };

    document.getElementById('timesheet').innerHTML = `
        <h1 class="page-title">👥 ${canEdit ? '근무 관리' : '내 근무'}</h1>
        
        <!-- Week Navigation -->
        <div class="week-nav">
            <button class="week-btn" id="prevWeek">◀</button>
            <div class="week-label ${isCurrentWeek ? 'current' : ''}">${weekLabel}${isCurrentWeek ? ' (이번주)' : ''}</div>
            <button class="week-btn" id="nextWeek">▶</button>
        </div>
        
        <!-- Mobile: Card View / Desktop: Grid View -->
        <div class="schedule-cards">
            ${visibleWorkers.map(w => {
                const ws = w.shifts?.[weekKey] || {};
                return `
                <div class="schedule-card">
                    <div class="sc-header">
                        <span class="sc-name">${w.emoji} ${w.name}</span>
                        <span class="sc-hours">${weeklyStats.find(x=>x.id===w.id)?.hours || 0}h</span>
                    </div>
                    <div class="sc-days">
                        ${DAYS.map((d,i) => {
                            const dayShifts = ws[i] || [];
                            const hasShift = dayShifts.length > 0;
                            return `<div class="sc-day ${hasShift ? 'has-shift' : ''} ${i === selectedDay ? 'selected' : ''}" data-worker="${w.id}" data-day="${i}">
                                <span class="sc-day-name">${d}</span>
                                <span class="sc-day-time">${getShiftText(dayShifts)}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `}).join('')}
        </div>

        <!-- Day Detail (for editing) -->
        ${canEdit ? `
        <div class="day-detail">
            <div class="dd-title">${DAYS[selectedDay]}요일 상세</div>
            <div class="timetable">
                <div class="time-header">
                    ${[9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(h => `<div class="time-col">${h}</div>`).join('')}
                </div>
                <div class="time-body">
                    ${visibleWorkers.map(w => {
                        const weekShifts = w.shifts?.[weekKey] || {};
                        const dayShifts = weekShifts[selectedDay] || [];
                        return `
                        <div class="time-row" data-worker="${w.id}">
                            <div class="worker-label" data-id="${w.id}">
                                <span class="wl-emoji">${w.emoji}</span>
                                <span class="wl-name">${w.name}</span>
                            </div>
                            <div class="time-slots">
                                ${SLOTS.map(slot => {
                                    const inShift = dayShifts.some(s => slot >= s.start && slot < s.end);
                                    return `<div class="time-slot ${inShift ? 'active' : ''}" data-slot="${slot}" data-worker="${w.id}"></div>`;
                                }).join('')}
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Worker Summary -->
        <div class="worker-summary">
            <div class="summary-title">📋 주간 급여</div>
            ${weeklyStats.map(w => `
                <div class="summary-row ${canEdit ? '' : 'no-click'}" data-id="${canEdit ? w.id : ''}">
                    <span class="sr-worker">${w.emoji} ${w.name}</span>
                    <span class="sr-hours">${w.hours}h</span>
                    <span class="sr-pay">${w.total.toLocaleString()}원 ${w.bonus ? '<span class="badge bonus">+주휴</span>' : ''}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Week navigation
    document.getElementById('prevWeek').onclick = () => { store.weekOffset--; renderTimesheet(); };
    document.getElementById('nextWeek').onclick = () => { store.weekOffset++; renderTimesheet(); };
    
    // Card day click -> select day
    document.querySelectorAll('.sc-day').forEach(el => {
        el.onclick = () => { store.selectedDay = +el.dataset.day; renderTimesheet(); };
    });
    
    // Time slot interactions (only if can edit)
    if (canEdit) {
        initTimeSlotDrag(selectedDay, weekKey);
        
        // Worker label click -> edit modal
        document.querySelectorAll('.worker-label').forEach(el => {
            el.onclick = () => showWorkerModal(+el.dataset.id);
        });
        
        // Summary row click -> edit modal
        document.querySelectorAll('.summary-row[data-id]').forEach(el => {
            if (el.dataset.id) el.onclick = () => showWorkerModal(+el.dataset.id);
        });
    }
}

let isDragging = false, dragMode = null, dragWorker = null, currentWeekKey = null;

function initTimeSlotDrag(selectedDay, weekKey) {
    currentWeekKey = weekKey;
    const slots = document.querySelectorAll('.time-slot');
    
    const handleStart = (e) => {
        const slot = e.target.closest('.time-slot');
        if(!slot) return;
        isDragging = true;
        dragWorker = +slot.dataset.worker;
        dragMode = slot.classList.contains('active') ? 'remove' : 'add';
        toggleSlot(slot, selectedDay, weekKey);
    };
    
    const handleMove = (e) => {
        if(!isDragging) return;
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = el?.closest('.time-slot');
        if(slot && +slot.dataset.worker === dragWorker) {
            toggleSlot(slot, selectedDay, weekKey);
        }
    };
    
    const handleEnd = () => {
        if(isDragging) { save(); }
        isDragging = false; dragMode = null; dragWorker = null;
    };
    
    slots.forEach(slot => {
        slot.addEventListener('mousedown', handleStart);
        slot.addEventListener('touchstart', handleStart, {passive: false});
    });
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, {passive: false});
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
}

function toggleSlot(slot, day, weekKey) {
    const slotTime = parseFloat(slot.dataset.slot);
    const workerId = +slot.dataset.worker;
    const worker = store.workers.find(w => w.id === workerId);
    if(!worker) return;
    
    if(!worker.shifts) worker.shifts = {};
    if(!worker.shifts[weekKey]) worker.shifts[weekKey] = {};
    if(!worker.shifts[weekKey][day]) worker.shifts[weekKey][day] = [];
    
    const dayShifts = worker.shifts[weekKey][day];
    const isActive = slot.classList.contains('active');
    
    if(dragMode === 'add' && !isActive) {
        slot.classList.add('active');
        addSlotToShifts(dayShifts, slotTime);
    } else if(dragMode === 'remove' && isActive) {
        slot.classList.remove('active');
        removeSlotFromShifts(dayShifts, slotTime);
    }
}

function addSlotToShifts(shifts, slot) {
    const slotEnd = slot + 0.5;
    let merged = false;
    for(let s of shifts) {
        if(slot === s.end) { s.end = slotEnd; merged = true; break; }
        if(slotEnd === s.start) { s.start = slot; merged = true; break; }
        if(slot >= s.start && slot < s.end) { merged = true; break; }
    }
    if(!merged) shifts.push({start: slot, end: slotEnd});
    mergeShifts(shifts);
}

function removeSlotFromShifts(shifts, slot) {
    const slotEnd = slot + 0.5;
    for(let i = shifts.length - 1; i >= 0; i--) {
        const s = shifts[i];
        if(slot >= s.start && slot < s.end) {
            if(slot === s.start) s.start = slotEnd;
            else if(slotEnd === s.end) s.end = slot;
            else {
                shifts.push({start: slotEnd, end: s.end});
                s.end = slot;
            }
            if(s.start >= s.end) shifts.splice(i, 1);
            break;
        }
    }
}

function mergeShifts(shifts) {
    shifts.sort((a,b) => a.start - b.start);
    for(let i = shifts.length - 1; i > 0; i--) {
        if(shifts[i].start <= shifts[i-1].end) {
            shifts[i-1].end = Math.max(shifts[i-1].end, shifts[i].end);
            shifts.splice(i, 1);
        }
    }
}

function showWorkerModal(id) {
    const w = store.workers.find(x => x.id === id);
    if(!w) return;
    
    // Calculate stats
    let totalHours = 0;
    Object.values(w.shifts || {}).forEach(dayShifts => {
        dayShifts.forEach(s => totalHours += (s.end - s.start));
    });
    const basePay = totalHours * w.wage;
    const bonus = totalHours >= 15 ? Math.floor((totalHours/40)*8*w.wage) : 0;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">${w.emoji} ${w.name}</div>
            
            <div class="worker-stats">
                <div class="ws-item"><span class="ws-label">주간 근무</span><span class="ws-value">${totalHours}시간</span></div>
                <div class="ws-item"><span class="ws-label">시급</span><span class="ws-value">${w.wage.toLocaleString()}원</span></div>
                <div class="ws-item"><span class="ws-label">기본급</span><span class="ws-value">${basePay.toLocaleString()}원</span></div>
                ${bonus ? `<div class="ws-item bonus"><span class="ws-label">주휴수당</span><span class="ws-value">+${bonus.toLocaleString()}원</span></div>` : ''}
                <div class="ws-item total"><span class="ws-label">총 주급</span><span class="ws-value">${(basePay+bonus).toLocaleString()}원</span></div>
            </div>
            
            <label>시급 수정</label>
            <input type="number" id="editWage" value="${w.wage}">
            
            <div class="modal-actions">
                <button class="modal-btn cancel">취소</button>
                <button class="modal-btn confirm">저장</button>
            </div>
            <button class="modal-btn delete-btn">🗑️ 직원 삭제</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel').onclick = () => modal.remove();
    modal.querySelector('.confirm').onclick = () => {
        w.wage = +modal.querySelector('#editWage').value || w.wage;
        save(); modal.remove(); renderTimesheet();
    };
    modal.querySelector('.delete-btn').onclick = () => {
        if(confirm(`"${w.name}" 삭제하시겠습니까?`)) {
            store.workers = store.workers.filter(x => x.id !== id);
            save(); modal.remove(); renderTimesheet();
        }
    };
}

function showAddWorkerModal() {
    const emojis = ['👨','👩','👦','👧','🧑','👴','👵','🧔','👱'];
    let emoji = '👨';
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">👥 직원 추가</div>
            <label>아이콘</label>
            <div class="emoji-select">
                ${emojis.map(e => `<button class="emoji-btn ${e===emoji?'active':''}">${e}</button>`).join('')}
            </div>
            <label>이름</label>
            <input type="text" id="newWorkerName" placeholder="홍길동">
            <label>시급</label>
            <input type="number" id="newWorkerWage" value="10030">
            <div class="modal-actions">
                <button class="modal-btn cancel">취소</button>
                <button class="modal-btn confirm">추가</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.emoji-btn').forEach(b => {
        b.onclick = () => {
            modal.querySelectorAll('.emoji-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            emoji = b.textContent;
        };
    });
    modal.querySelector('.cancel').onclick = () => modal.remove();
    modal.querySelector('.confirm').onclick = () => {
        const name = modal.querySelector('#newWorkerName').value.trim();
        if(!name) return alert('이름을 입력하세요');
        store.workers.push({
            id: Date.now(), name, emoji,
            wage: +modal.querySelector('#newWorkerWage').value || 10030,
            shifts: {}
        });
        save(); modal.remove(); renderTimesheet();
    };
}

// ===== SALES =====
function renderSales() {
    const week = 7*24*60*60*1000;
    const recentSales = store.sales.filter(s => Date.now() - s.date < week);
    const salesByFlavor = {};
    recentSales.forEach(s => { salesByFlavor[s.flavorId] = (salesByFlavor[s.flavorId]||0) + s.qty; });
    
    const totalSold = recentSales.reduce((s,x)=>s+x.qty,0);
    const counts = countTubs();
    
    // Recommendations
    const recommendations = store.flavors.map(f => {
        const sold = salesByFlavor[f.id] || 0;
        const stock = store.storage[f.id] || 0;
        return {...f, sold, stock, recommend: Math.max(0, sold * 2 - stock)};
    }).filter(f => f.recommend > 0 || f.stock < 2).sort((a,b) => b.recommend - a.recommend).slice(0,5);

    document.getElementById('sales').innerHTML = `
        <h1 class="page-title">📊 판매 분석</h1>
        <div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-value">${counts.total}</div>
                <div class="stat-label">총 재고</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🛒</div>
                <div class="stat-value">${totalSold}</div>
                <div class="stat-label">주간 판매</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🍨</div>
                <div class="stat-value">${store.flavors.length}</div>
                <div class="stat-label">맛 종류</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🔝</div>
                <div class="stat-value">${counts.display}</div>
                <div class="stat-label">진열중</div>
            </div>
        </div>
        <div class="recommend-section">
            <div class="recommend-title">🚨 주문 추천</div>
            ${recommendations.length ? `
                <div class="recommend-list">
                    ${recommendations.map(f => `
                        <div class="recommend-item">
                            <div class="tub" style="text-shadow:0 0 8px ${f.color}">🍨</div>
                            <div class="info">
                                <div class="name">${f.name}</div>
                                <div class="reason">창고 ${f.stock}통 / 주간 ${f.sold}통 판매</div>
                            </div>
                            <div class="qty">+${f.recommend || 2}</div>
                        </div>
                    `).join('')}
                </div>
            ` : '<div style="text-align:center;color:#666;padding:20px">✅ 재고 충분!</div>'}
        </div>
        <div class="recommend-section" style="margin-top:16px">
            <div class="recommend-title">🔥 인기 맛 TOP 5</div>
            <div class="recommend-list">
                ${Object.entries(salesByFlavor)
                    .sort((a,b)=>b[1]-a[1])
                    .slice(0,5)
                    .map(([id,qty]) => {
                        const f = store.flavors.find(x=>x.id===+id);
                        return f ? `
                            <div class="recommend-item">
                                <div class="tub" style="text-shadow:0 0 8px ${f.color}">🍨</div>
                                <div class="info"><div class="name">${f.name}</div></div>
                                <div class="qty">${qty}통</div>
                            </div>
                        ` : '';
                    }).join('') || '<div style="text-align:center;color:#666;padding:20px">판매 데이터 없음</div>'}
            </div>
        </div>
    `;
}

// Init - only register service worker, rendering handled by index.html
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
