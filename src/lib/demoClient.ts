/* eslint-disable @typescript-eslint/no-explicit-any */
// In-memory fake of the subset of the Supabase JS client this app uses, so the
// real UI + data hooks run with no backend. Seeded with realistic sample data
// and persisted to localStorage. Activated by VITE_DEMO=1 (see supabase.ts).

type Row = Record<string, any>
interface Result {
  data: any
  error: any
}
type Tables = Record<string, Row[]>

const LS_KEY = 'br_demo_db_v2'
const UUID_TABLES = new Set(['shifts', 'users', 'stores'])
const STORE_ID = 'demo-store'

// --- sample data -----------------------------------------------------------
const FLAVORS: Row[] = [
  [1, '엄마는외계인', '#9c27b0', 'fixed'], [2, '민트초코칩', '#3eb489', 'fixed'],
  [3, '바닐라', '#fff8dc', 'fixed'], [4, '초콜릿', '#5d4037', 'fixed'],
  [5, '딸기', '#e91e63', 'fixed'], [6, '레인보우샤베트', '#ff9800', 'fixed'],
  [7, '아몬드봉봉', '#d4a574', 'fixed'], [8, '체리쥬빌레', '#c62828', 'fixed'],
  [9, '뉴욕치즈케이크', '#ffd54f', 'fixed'], [10, '슈팅스타', '#7c4dff', 'fixed'],
  [11, '자모카아몬드훠지', '#6d4c41', 'fixed'], [12, '피스타치오아몬드', '#aed581', 'fixed'],
  [13, '오레오쿠키앤크림', '#424242', 'fixed'], [14, '사랑에빠진딸기', '#f48fb1', 'fixed'],
  [15, '31요거트', '#fff9c4', 'fixed'], [16, '이상한나라의솜사탕', '#ce93d8', 'fixed'],
  [17, '베리베리스트로베리', '#ef5350', 'fixed'], [18, '초코나무숲', '#4e342e', 'fixed'],
  [19, '망고탱고', '#ffb74d', 'fixed'], [20, '그린티', '#81c784', 'fixed'],
  [101, '눈꽃빙수', '#e3f2fd', 'seasonal'], [102, '수박바', '#ef5350', 'seasonal'],
  [103, '메론', '#c5e1a5', 'seasonal'], [104, '복숭아', '#ffab91', 'seasonal'],
  [201, '핑크스타', '#f06292', 'limited'], [202, '골든초코볼', '#ffc107', 'limited'],
  [301, '쫀득초코브라우니', '#4e342e', 'special'], [302, '트리플치즈케이크', '#ffe082', 'special'],
].map(([id, name, color, type]) => ({
  id,
  store_id: STORE_ID,
  name,
  color,
  type,
  available: !(id === 104), // 복숭아 = 판매중지, to show that state
}))

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function seedShifts(): Row[] {
  // Fill the current month with a believable rota → real payroll numbers.
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const shifts: Row[] = []
  let i = 1
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    const dow = d.getDay() // 0=Sun..6=Sat
    const date = iso(d)
    // 김민수(1): 월수금 09:00–15:00 (6h)
    if (dow === 1 || dow === 3 || dow === 5)
      shifts.push({ id: `sh-${i++}`, store_id: STORE_ID, worker_id: 1, work_date: date, start_min: 540, end_min: 900 })
    // 이지은(2): 화목 14:00–22:00 (8h)
    if (dow === 2 || dow === 4)
      shifts.push({ id: `sh-${i++}`, store_id: STORE_ID, worker_id: 2, work_date: date, start_min: 840, end_min: 1320 })
    // 박서연(3): 토일 12:00–20:00 (8h)
    if (dow === 6 || dow === 0)
      shifts.push({ id: `sh-${i++}`, store_id: STORE_ID, worker_id: 3, work_date: date, start_min: 720, end_min: 1200 })
    d.setDate(d.getDate() + 1)
  }
  return shifts
}

function seedSales(): Row[] {
  // ~30 tub replacements over the last 30 days, weighted to popular flavors.
  const popular = [1, 2, 5, 6, 13, 1, 2, 5, 1, 2, 6, 13, 10, 17, 3, 1, 2, 5]
  const sales: Row[] = []
  for (let k = 0; k < 30; k++) {
    const fid = popular[Math.floor(Math.random() * popular.length)]
    const daysAgo = Math.floor(Math.random() * 30)
    const dt = new Date()
    dt.setDate(dt.getDate() - daysAgo)
    sales.push({ id: k + 1, store_id: STORE_ID, flavor_id: fid, quantity: 1, sold_at: dt.toISOString() })
  }
  return sales
}

function seedCabinets(): Row[] {
  // A handful of filled display slots, including a couple low/critical levels.
  const filled: [string, string, number, number, number][] = [
    ['cab1', 'top', 0, 1, 80], ['cab1', 'top', 1, 2, 45], ['cab1', 'top', 2, 5, 15],
    ['cab1', 'top', 3, 6, 100], ['cab1', 'top', 4, 13, 60], ['cab1', 'top', 5, 9, 30],
    ['cab1', 'bottom', 0, 10, 100], ['cab1', 'bottom', 1, 17, 100],
    ['cab2', 'top', 0, 3, 70], ['cab2', 'top', 1, 19, 90],
  ]
  return filled.map(([cab, row, pos, fid, lvl], idx) => ({
    id: idx + 1,
    store_id: STORE_ID,
    cabinet_name: cab,
    row_name: row,
    position: pos,
    flavor_id: fid,
    level: lvl,
  }))
}

function seedDB(): Tables {
  const storage: Row[] = [
    [1, 3], [2, 1], [3, 0], [5, 2], [6, 4], [9, 0], [10, 1], [13, 5], [17, 2], [19, 1],
  ].map(([fid, qty], i) => ({ id: i + 1, store_id: STORE_ID, flavor_id: fid, quantity: qty }))

  return {
    stores: [{ id: STORE_ID, name: '데모 베스킨라빈스', default_par: 2 }],
    users: [
      { id: 'u-owner', name: '점주', pin: '123456', role: 'owner', worker_id: null },
      { id: 'u-mgr', name: '김민수', pin: '123456', role: 'manager', worker_id: 1 },
    ],
    store_users: [
      { id: 1, store_id: STORE_ID, user_id: 'u-owner', role: 'owner' },
      { id: 2, store_id: STORE_ID, user_id: 'u-mgr', role: 'manager' },
    ],
    workers: [
      { id: 1, store_id: STORE_ID, name: '김민수', emoji: '👨', wage: 10320, tax_withholding: true },
      { id: 2, store_id: STORE_ID, name: '이지은', emoji: '👩', wage: 10500, tax_withholding: true },
      { id: 3, store_id: STORE_ID, name: '박서연', emoji: '🧑', wage: 10320, tax_withholding: false },
    ],
    flavors: FLAVORS,
    cabinets: seedCabinets(),
    storage,
    shifts: seedShifts(),
    payroll_extras: [
      { id: 1, store_id: STORE_ID, worker_id: 1, year_month: currentYm(), amount: 50000, note: '명절 보너스' },
    ],
    sales: seedSales(),
    activity_log: seedActivity(),
  }
}

function currentYm(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function seedActivity(): Row[] {
  // A few recent history entries so the 변경 기록 view isn't empty in the demo.
  const samples: [string, string, number][] = [
    ['새 통 교체: 민트초코칩', '재고', 1],
    ['창고 재고 변경: 딸기 3→2통', '재고', 3],
    ['이지은 6월 3일 (화) 근무 추가 14:00–22:00', '근무', 5],
    ['김민수 시급 변경: 10,320원', '급여', 26],
    ['목표 재고 변경: 각 맛 2통', '주문', 50],
  ]
  return samples.map(([message, category, minsAgo], i) => {
    const dt = new Date()
    dt.setMinutes(dt.getMinutes() - minsAgo)
    return { id: i + 1, store_id: STORE_ID, message, category, created_at: dt.toISOString() }
  })
}

// --- query builder ---------------------------------------------------------
// `await`-able (has a thenable `then`); the real Supabase types are used by the
// hooks via the client-level cast, so this only needs to be internally sound.
class DemoQuery {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private filters: { col: string; op: 'eq' | 'gte' | 'lt'; val: any }[] = []
  private values: Row | Row[] | null = null
  private conflict: string[] | null = null
  private orderings: { col: string; asc: boolean }[] = []
  private wantSingle = false
  private returning = false
  private limitN: number | null = null

  constructor(private db: DemoDB, private table: string) {}

  select(_cols = '*') {
    if (this.op !== 'select') this.returning = true
    return this
  }
  insert(v: Row | Row[]) {
    this.op = 'insert'
    this.values = v
    return this
  }
  update(v: Row) {
    this.op = 'update'
    this.values = v
    return this
  }
  upsert(v: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert'
    this.values = v
    this.conflict = opts?.onConflict?.split(',').map((s) => s.trim()) ?? null
    return this
  }
  delete() {
    this.op = 'delete'
    return this
  }
  eq(col: string, val: any) {
    this.filters.push({ col, op: 'eq', val })
    return this
  }
  gte(col: string, val: any) {
    this.filters.push({ col, op: 'gte', val })
    return this
  }
  lt(col: string, val: any) {
    this.filters.push({ col, op: 'lt', val })
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderings.push({ col, asc: opts?.ascending !== false })
    return this
  }
  limit(n: number) {
    this.limitN = n
    return this
  }
  single() {
    this.wantSingle = true
    return this
  }

  then(resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) {
    return Promise.resolve(this.exec()).then(resolve, reject)
  }

  private match = (row: Row) =>
    this.filters.every((f) => {
      const v = row[f.col]
      if (f.op === 'eq') return v === f.val
      if (f.op === 'gte') return v >= f.val
      return v < f.val
    })

  private exec(): Result {
    try {
      const tbl = this.db.tables[this.table] ?? (this.db.tables[this.table] = [])
      if (this.op === 'select') {
        let rows = tbl.filter(this.match)
        for (const o of this.orderings) {
          rows = [...rows].sort((a, b) => (a[o.col] < b[o.col] ? -1 : a[o.col] > b[o.col] ? 1 : 0) * (o.asc ? 1 : -1))
        }
        if (this.limitN != null) rows = rows.slice(0, this.limitN)
        if (this.wantSingle) {
          if (rows.length === 0) return { data: null, error: { message: 'No rows' } }
          return { data: rows[0], error: null }
        }
        return { data: rows, error: null }
      }

      const arr = Array.isArray(this.values) ? this.values : this.values ? [this.values] : []

      if (this.op === 'insert') {
        const inserted = arr.map((v) => this.db.withId(this.table, { ...v }))
        tbl.push(...inserted)
        this.db.persist()
        return { data: this.returning ? (this.wantSingle ? inserted[0] : inserted) : null, error: null }
      }
      if (this.op === 'upsert') {
        const out: Row[] = []
        for (const v of arr) {
          const existing = this.conflict
            ? tbl.find((r) => this.conflict!.every((c) => r[c] === v[c]))
            : undefined
          if (existing) {
            Object.assign(existing, v)
            out.push(existing)
          } else {
            const row = this.db.withId(this.table, { ...v })
            tbl.push(row)
            out.push(row)
          }
        }
        this.db.persist()
        return { data: this.returning ? out : null, error: null }
      }
      if (this.op === 'update') {
        const matched = tbl.filter(this.match)
        for (const r of matched) Object.assign(r, this.values)
        this.db.persist()
        return { data: this.returning ? matched : null, error: null }
      }
      // delete
      this.db.tables[this.table] = tbl.filter((r) => !this.match(r))
      this.db.persist()
      return { data: null, error: null }
    } catch (e) {
      return { data: null, error: { message: e instanceof Error ? e.message : String(e) } }
    }
  }
}

class DemoDB {
  tables: Tables
  private counter = 100000

  constructor() {
    const saved = localStorage.getItem(LS_KEY)
    this.tables = saved ? JSON.parse(saved) : seedDB()
    if (!saved) this.persist()
  }

  persist() {
    localStorage.setItem(LS_KEY, JSON.stringify(this.tables))
  }

  nextId(): number {
    return this.counter++
  }

  withId(table: string, row: Row): Row {
    if (row.id == null) row.id = UUID_TABLES.has(table) ? `${table}-${this.counter++}` : this.counter++
    return row
  }

  reset() {
    this.tables = seedDB()
    this.persist()
  }
}

// --- RPCs ------------------------------------------------------------------
function runRpc(db: DemoDB, name: string, args: any): Result {
  const t = db.tables
  const ok = (data: any): Result => ({ data, error: null })
  const fail = (message: string): Result => ({ data: null, error: { message } })
  switch (name) {
    case 'login': {
      const u = t.users.find((x) => x.name === args.p_name && x.pin === args.p_pin)
      if (!u) return ok(null)
      const stores = t.store_users
        .filter((su) => su.user_id === u.id)
        .map((su) => {
          const s = t.stores.find((x) => x.id === su.store_id)!
          return { storeId: su.store_id, role: su.role, store: { id: s.id, name: s.name } }
        })
      return ok({ user: { id: u.id, name: u.name, role: u.role, workerId: u.worker_id }, stores })
    }
    case 'change_pin': {
      const u = t.users.find((x) => x.id === args.p_user_id)
      if (!u || u.pin !== args.p_old) return fail('현재 비밀번호가 올바르지 않습니다')
      if ((args.p_new ?? '').length < 6) return fail('새 비밀번호는 6자리 이상이어야 합니다')
      u.pin = args.p_new
      db.persist()
      return ok(true)
    }
    case 'list_store_users':
      return ok(
        t.store_users
          .filter((su) => su.store_id === args.p_store_id)
          .map((su) => {
            const u = t.users.find((x) => x.id === su.user_id)!
            return { id: u.id, name: u.name, role: su.role, workerId: u.worker_id }
          }),
      )
    case 'admin_create_user': {
      if (t.users.some((x) => x.name === args.p_name)) return fail('이미 사용 중인 이름입니다')
      const id = `u-${db.nextId()}`
      t.users.push({ id, name: args.p_name, pin: args.p_pin, role: args.p_role, worker_id: args.p_worker_id ?? null })
      t.store_users.push({ id: db.nextId(), store_id: args.p_store_id, user_id: id, role: args.p_role })
      db.persist()
      return ok({ id, name: args.p_name, role: args.p_role, workerId: args.p_worker_id ?? null })
    }
    case 'admin_set_pin': {
      const u = t.users.find((x) => x.id === args.p_target_user_id)
      if (u) {
        u.pin = args.p_new
        db.persist()
      }
      return ok(true)
    }
    case 'admin_delete_user': {
      t.store_users = t.store_users.filter((su) => !(su.store_id === args.p_store_id && su.user_id === args.p_target_user_id))
      t.users = t.users.filter((u) => u.id !== args.p_target_user_id)
      db.persist()
      return ok(true)
    }
    case 'admin_create_store': {
      const id = `store-${db.nextId()}`
      t.stores.push({ id, name: args.p_name, default_par: 2 })
      t.store_users.push({ id: db.nextId(), store_id: id, user_id: args.p_owner_id, role: 'owner' })
      db.persist()
      return ok({ id, name: args.p_name })
    }
    case 'admin_rename_store': {
      const s = t.stores.find((x) => x.id === args.p_store_id)
      if (s) {
        s.name = args.p_name
        db.persist()
      }
      return ok(true)
    }
    default:
      return fail(`demo: unknown rpc ${name}`)
  }
}

export function createDemoClient() {
  const db = new DemoDB()
  return {
    from(table: string) {
      return new DemoQuery(db, table)
    },
    rpc(name: string, args: any) {
      return Promise.resolve(runRpc(db, name, args))
    },
    __resetDemo() {
      db.reset()
    },
  }
}
