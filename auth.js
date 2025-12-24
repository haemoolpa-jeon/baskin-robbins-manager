// Auth & Role Management
let currentUser = JSON.parse(localStorage.getItem('br_user')) || null;
let userStores = [];
let loginAttempts = parseInt(localStorage.getItem('br_login_attempts')) || 0;
let lockoutUntil = parseInt(localStorage.getItem('br_lockout_until')) || 0;

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// Role permissions
const PERMISSIONS = {
    owner: { inventory: 'full', timesheet: 'full', sales: 'full', users: 'full', stores: 'full' },
    manager: { inventory: 'full', timesheet: 'view_self', sales: 'view', users: 'none', stores: 'none' },
    parttime: { inventory: 'none', timesheet: 'view_self', sales: 'none', users: 'none', stores: 'none' }
};

function canAccess(feature, action = 'view') {
    if (!currentUser) return false;
    const perm = PERMISSIONS[currentUser.role]?.[feature];
    if (perm === 'full') return true;
    if (perm === 'view' && action === 'view') return true;
    if (perm === 'view_self' && action === 'view') return true;
    return false;
}

function isOwner() { return currentUser?.role === 'owner'; }
function isManager() { return currentUser?.role === 'manager'; }
function isParttime() { return currentUser?.role === 'parttime'; }

// Login UI
function showLoginScreen() {
    const isLocked = Date.now() < lockoutUntil;
    const remainingTime = Math.ceil((lockoutUntil - Date.now()) / 1000);
    
    document.getElementById('app').innerHTML = `
        <div class="login-screen">
            <div class="login-box">
                <div class="login-logo">🍨</div>
                <h1 class="login-title">BR 매장관리</h1>
                ${isLocked ? `
                    <div class="lockout-msg">🔒 로그인 ${MAX_ATTEMPTS}회 실패<br>
                    <span id="lockoutTimer">${remainingTime}</span>초 후 재시도</div>
                ` : `
                    <input type="text" id="loginName" class="login-input" placeholder="이름" autocomplete="off">
                    <input type="password" id="loginPin" class="login-input" placeholder="비밀번호 (6자리 이상)" autocomplete="off">
                    <button class="login-btn" id="loginBtn">로그인</button>
                    <div class="login-error" id="loginError"></div>
                    ${loginAttempts > 0 ? `<div class="login-attempts">남은 시도: ${MAX_ATTEMPTS - loginAttempts}회</div>` : ''}
                `}
            </div>
        </div>
    `;
    
    if (isLocked) {
        const timer = setInterval(() => {
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            const el = document.getElementById('lockoutTimer');
            if (el) el.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(timer);
                loginAttempts = 0;
                lockoutUntil = 0;
                localStorage.removeItem('br_login_attempts');
                localStorage.removeItem('br_lockout_until');
                showLoginScreen();
            }
        }, 1000);
        return;
    }
    
    document.getElementById('loginBtn').onclick = handleLogin;
    document.getElementById('loginPin').onkeyup = (e) => { if(e.key === 'Enter') handleLogin(); };
    document.getElementById('loginName').focus();
}

async function handleLogin() {
    const name = document.getElementById('loginName').value.trim();
    const pin = document.getElementById('loginPin').value;
    const errorEl = document.getElementById('loginError');
    
    if (!name) { errorEl.textContent = '이름을 입력하세요'; return; }
    if (!pin || pin.length < 6) { errorEl.textContent = '비밀번호 6자리 이상 입력하세요'; return; }
    
    try {
        const { data: user, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('name', name)
            .eq('pin', pin)
            .single();
        
        if (error || !user) {
            loginAttempts++;
            localStorage.setItem('br_login_attempts', loginAttempts);
            
            if (loginAttempts >= MAX_ATTEMPTS) {
                lockoutUntil = Date.now() + LOCKOUT_DURATION;
                localStorage.setItem('br_lockout_until', lockoutUntil);
                showLoginScreen();
                return;
            }
            
            errorEl.textContent = `이름 또는 비밀번호가 틀렸습니다 (${MAX_ATTEMPTS - loginAttempts}회 남음)`;
            return;
        }
        
        // Success - reset attempts
        loginAttempts = 0;
        localStorage.removeItem('br_login_attempts');
        localStorage.removeItem('br_lockout_until');
        
        const { data: storeLinks } = await supabaseClient
            .from('store_users')
            .select('store_id, role, stores(id, name)')
            .eq('user_id', user.id);
        
        currentUser = user;
        userStores = storeLinks || [];
        
        if (userStores.length > 0) {
            STORE_ID = userStores[0].store_id;
            localStorage.setItem('br_store_id', STORE_ID);
        }
        
        localStorage.setItem('br_user', JSON.stringify(user));
        initApp();
        
    } catch (e) {
        console.error('Login error:', e);
        errorEl.textContent = '로그인 실패';
    }
}

function logout() {
    currentUser = null;
    userStores = [];
    localStorage.removeItem('br_user');
    showLoginScreen();
}

// Password change
async function showChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">🔐 비밀번호 변경</div>
            <label>현재 비밀번호</label>
            <input type="password" id="currentPw" class="login-input">
            <label>새 비밀번호 (6자리 이상)</label>
            <input type="password" id="newPw" class="login-input">
            <label>새 비밀번호 확인</label>
            <input type="password" id="confirmPw" class="login-input">
            <div class="pw-error" id="pwError"></div>
            <div class="modal-actions">
                <button class="modal-btn cancel">취소</button>
                <button class="modal-btn confirm">변경</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel').onclick = () => modal.remove();
    modal.querySelector('.confirm').onclick = async () => {
        const current = document.getElementById('currentPw').value;
        const newPw = document.getElementById('newPw').value;
        const confirm = document.getElementById('confirmPw').value;
        const errorEl = document.getElementById('pwError');
        
        if (current !== currentUser.pin) { errorEl.textContent = '현재 비밀번호가 틀렸습니다'; return; }
        if (newPw.length < 6) { errorEl.textContent = '새 비밀번호는 6자리 이상이어야 합니다'; return; }
        if (newPw !== confirm) { errorEl.textContent = '새 비밀번호가 일치하지 않습니다'; return; }
        
        const { error } = await supabaseClient
            .from('users')
            .update({ pin: newPw })
            .eq('id', currentUser.id);
        
        if (error) { errorEl.textContent = '변경 실패'; return; }
        
        currentUser.pin = newPw;
        localStorage.setItem('br_user', JSON.stringify(currentUser));
        alert('비밀번호가 변경되었습니다');
        modal.remove();
    };
}

// User management (owner only)
async function showUserManagement() {
    if (!isOwner()) return;
    
    const { data: users } = await supabaseClient
        .from('store_users')
        .select('*, users(*)')
        .eq('store_id', STORE_ID);
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">👥 사용자 관리</div>
            <div class="user-list">
                ${(users || []).map(su => `
                    <div class="user-item" data-id="${su.users.id}">
                        <span class="user-role-badge ${su.role}">${su.role === 'owner' ? '👑점주' : su.role === 'manager' ? '🏷️매니저' : '👤알바'}</span>
                        <span class="user-name">${su.users.name}</span>
                        ${su.role !== 'owner' ? `<button class="user-delete" data-id="${su.users.id}">🗑️</button>` : ''}
                    </div>
                `).join('')}
            </div>
            <button class="modal-btn confirm" id="addUserBtn">+ 사용자 추가</button>
            <div class="modal-actions">
                <button class="modal-btn cancel">닫기</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel').onclick = () => modal.remove();
    modal.querySelector('#addUserBtn').onclick = () => { modal.remove(); showAddUserModal(); };
    modal.querySelectorAll('.user-delete').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('삭제하시겠습니까? (직원 정보도 함께 삭제됩니다)')) {
                // Get user to find worker_id
                const { data: user } = await supabaseClient.from('users').select('worker_id').eq('id', btn.dataset.id).single();
                
                // Delete store_user link
                await supabaseClient.from('store_users').delete().eq('user_id', btn.dataset.id).eq('store_id', STORE_ID);
                
                // Delete worker if linked
                if (user?.worker_id) {
                    await supabaseClient.from('shifts').delete().eq('worker_id', user.worker_id);
                    await supabaseClient.from('workers').delete().eq('id', user.worker_id);
                    store.workers = store.workers.filter(w => w.id !== user.worker_id);
                    save();
                }
                
                modal.remove();
                renderTimesheet();
                showUserManagement();
            }
        };
    });
}

async function showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">사용자 추가</div>
            <label>이름 (로그인용)</label>
            <input type="text" id="newUserName" placeholder="홍길동">
            <label>비밀번호 (6자리 이상)</label>
            <input type="password" id="newUserPin" placeholder="******">
            <label>역할</label>
            <div class="role-select">
                <button class="role-btn active" data-role="manager">🏷️ 매니저</button>
                <button class="role-btn" data-role="parttime">👤 알바</button>
            </div>
            <label>시급</label>
            <input type="number" id="newUserWage" value="10030">
            <label>아이콘</label>
            <div class="emoji-select">
                ${['👨','👩','👦','👧','🧑','👴','👵','🧔','👱'].map((e,i) => `<button class="emoji-btn ${i===0?'active':''}">${e}</button>`).join('')}
            </div>
            <div class="modal-actions">
                <button class="modal-btn cancel">취소</button>
                <button class="modal-btn confirm">추가</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    let selectedRole = 'manager';
    let selectedEmoji = '👨';
    
    modal.querySelectorAll('.role-btn').forEach(btn => {
        btn.onclick = () => {
            modal.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRole = btn.dataset.role;
        };
    });
    
    modal.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.onclick = () => {
            modal.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedEmoji = btn.textContent;
        };
    });
    
    modal.querySelector('.cancel').onclick = () => modal.remove();
    modal.querySelector('.confirm').onclick = async () => {
        const name = document.getElementById('newUserName').value.trim();
        const pin = document.getElementById('newUserPin').value;
        const wage = parseInt(document.getElementById('newUserWage').value) || 10030;
        
        if (!name) { alert('이름을 입력하세요'); return; }
        if (pin.length < 6) { alert('비밀번호는 6자리 이상이어야 합니다'); return; }
        
        // Create worker first
        const workerId = Date.now();
        store.workers.push({
            id: workerId,
            name: name,
            emoji: selectedEmoji,
            wage: wage,
            shifts: {}
        });
        save();
        
        // Sync worker to cloud
        await supabaseClient.from('workers').insert({
            id: workerId,
            store_id: STORE_ID,
            name: name,
            emoji: selectedEmoji,
            wage: wage
        });
        
        // Create user linked to worker
        const { data: newUser, error } = await supabaseClient
            .from('users')
            .insert({ name, pin, role: selectedRole, worker_id: workerId })
            .select()
            .single();
        
        if (error) { alert('추가 실패: ' + error.message); return; }
        
        await supabaseClient.from('store_users').insert({
            store_id: STORE_ID,
            user_id: newUser.id,
            role: selectedRole
        });
        
        modal.remove();
        renderTimesheet();
        showUserManagement();
    };
}

// Store management (owner only)
async function showStoreManagement() {
    if (!isOwner()) return;
    
    const { data: stores } = await supabaseClient
        .from('store_users')
        .select('stores(*)')
        .eq('user_id', currentUser.id)
        .eq('role', 'owner');
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title">🏪 매장 관리</div>
            <div class="store-list">
                ${(stores || []).map(s => `
                    <div class="store-item ${s.stores.id === STORE_ID ? 'current' : ''}">
                        <span class="store-name-text">🏪 ${s.stores.name}</span>
                        ${s.stores.id === STORE_ID ? '<span class="current-badge">현재</span>' : ''}
                        <button class="store-switch-btn" data-id="${s.stores.id}" data-name="${s.stores.name}">선택</button>
                        <button class="store-edit-btn" data-id="${s.stores.id}" data-name="${s.stores.name}">✏️</button>
                    </div>
                `).join('')}
            </div>
            <button class="modal-btn confirm" id="addStoreBtn">+ 매장 추가</button>
            <div class="modal-actions">
                <button class="modal-btn cancel">닫기</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel').onclick = () => modal.remove();
    
    // Switch store
    modal.querySelectorAll('.store-switch-btn').forEach(btn => {
        btn.onclick = async () => {
            const storeId = btn.dataset.id;
            if (storeId !== STORE_ID) {
                await switchStore(storeId);
                modal.remove();
            }
        };
    });
    
    // Edit store name
    modal.querySelectorAll('.store-edit-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const storeId = btn.dataset.id;
            const currentName = btn.dataset.name;
            const newName = prompt('매장 이름:', currentName);
            if (newName && newName.trim() && newName !== currentName) {
                const { error } = await supabaseClient
                    .from('stores')
                    .update({ name: newName.trim() })
                    .eq('id', storeId);
                
                if (error) {
                    alert('수정 실패: ' + error.message);
                    return;
                }
                
                // Refresh stores list
                const { data: storeLinks } = await supabaseClient
                    .from('store_users')
                    .select('store_id, role, stores(id, name)')
                    .eq('user_id', currentUser.id);
                userStores = storeLinks || [];
                modal.remove();
                showStoreManagement();
            }
        };
    });
    
    modal.querySelector('#addStoreBtn').onclick = async () => {
        const name = prompt('새 매장 이름:');
        if (!name || !name.trim()) return;
        
        const { data: newStore, error } = await supabaseClient
            .from('stores')
            .insert({ name: name.trim() })
            .select()
            .single();
        
        if (error) {
            alert('추가 실패: ' + error.message);
            return;
        }
        
        if (newStore) {
            await supabaseClient.from('store_users').insert({
                store_id: newStore.id,
                user_id: currentUser.id,
                role: 'owner'
            });
            
            const { data: storeLinks } = await supabaseClient
                .from('store_users')
                .select('store_id, role, stores(id, name)')
                .eq('user_id', currentUser.id);
            userStores = storeLinks || [];
            modal.remove();
            showStoreManagement();
        }
    };
}

// Switch to different store and reload all data
async function switchStore(newStoreId) {
    STORE_ID = newStoreId;
    localStorage.setItem('br_store_id', STORE_ID);
    
    // Reset local store data
    store.flavors = [...defaultFlavors];
    store.cabinets = {
        cab1: { top: Array(16).fill(null), bottom: Array(16).fill(null) },
        cab2: { top: Array(16).fill(null), bottom: Array(16).fill(null) }
    };
    store.storage = {};
    store.workers = [];
    store.sales = [];
    
    // Load from cloud for new store
    await loadFromCloud();
    
    // Re-render everything
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderTimesheet === 'function') renderTimesheet();
    if (typeof renderSales === 'function') renderSales();
    
    // Update store selector if visible
    const storeSelect = document.getElementById('storeSelect');
    if (storeSelect) storeSelect.value = STORE_ID;
}
