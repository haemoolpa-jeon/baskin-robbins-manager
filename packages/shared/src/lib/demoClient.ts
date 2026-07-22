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
// Refreshed from BR Korea's public menu on 2026-07-17. Type labels are
// operational groupings for this app; BR does not publish these stock groups.
const FLAVORS: Row[] = [
  [1, '엄마는 외계인', '#9c27b0', 'fixed'], [2, '민트 초콜릿 칩', '#3eb489', 'fixed'],
  [3, '바닐라', '#fff8dc', 'fixed'], [4, '초콜릿', '#5d4037', 'fixed'],
  [5, '베리베리 스트로베리', '#ef5350', 'fixed'], [6, '레인보우 샤베트', '#ff9800', 'fixed'],
  [7, '아몬드 봉봉', '#d4a574', 'fixed'], [8, '체리쥬빌레', '#c62828', 'fixed'],
  [9, '뉴욕 치즈케이크', '#ffd54f', 'fixed'], [10, '슈팅스타', '#7c4dff', 'fixed'],
  [11, '자모카 아몬드 훠지', '#6d4c41', 'fixed'], [12, '피스타치오 아몬드', '#aed581', 'fixed'],
  [13, '오레오 쿠키 앤 밀크', '#424242', 'fixed'], [14, '사랑에 빠진 딸기', '#f48fb1', 'fixed'],
  [15, '31요거트', '#fff9c4', 'fixed'], [16, '바람과 함께 사라지다', '#90caf9', 'fixed'],
  [17, '초콜릿 무스', '#6d4c41', 'fixed'], [18, '그린티', '#81c784', 'fixed'],
  [19, '알폰소 망고', '#ffb74d', 'fixed'], [20, '애플민트', '#80cbc4', 'fixed'],
  [21, '소금 우유 아이스크림', '#f1eee2', 'fixed'],
  [101, '단짠팝팝 초코해변', '#8d6e63', 'seasonal'], [102, '나는 딸기치오', '#ef9a9a', 'seasonal'],
  [103, '피치 요거트', '#ffccbc', 'seasonal'], [104, '메롱 멜론', '#c5e1a5', 'seasonal'],
  [105, '(Lessly Edition) 바 베 바', '#ffe0b2', 'seasonal'],
  [201, '쵸파의 코튼캔디 크런치', '#ce93d8', 'limited'], [202, '버즈의 애플 리치 빔', '#9ccc65', 'limited'],
  [203, '우디의 후르츠 어드벤처', '#ffb74d', 'limited'], [204, '두바이에서 온 엄마는 외계인', '#6d4c41', 'limited'],
  [301, '(Lessly Edition) 엄마는 외계인', '#7e57c2', 'special'],
].map(([id, name, color, type]) => ({
  id,
  store_id: STORE_ID,
  name,
  color,
  type,
  available: true,
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

function seedInventoryProducts(): Row[] {
  const p = (
    id: number,
    name: string,
    category: 'cake' | 'dessert' | 'supply',
    subtype: string,
    quantity: number,
    par: number,
    unit = '개',
    sizeLabel = '',
    location = '',
    packSize: number | null = null,
    available = true,
  ): Row => ({
    id, store_id: STORE_ID, name, category, subtype, quantity, par, unit,
    size_label: sizeLabel, location, expiry_date: null, pack_size: packSize, available,
  })

  return [
    p(10001, '원피스 보물상자 와츄원', 'cake', 'standard_cake', 2, 2, '개', '일반', '케이크 냉동고'),
    p(10002, '거침없이 나아가는 써니호!', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10003, '새 친구 릴리패드의 등장!', 'cake', 'standard_cake', 0, 1, '개', '일반', '케이크 냉동고'),
    p(10004, '초코앤쿠키 마이원 케이크', 'cake', 'standard_cake', 1, 2, '개', '일반', '케이크 냉동고'),
    p(10005, '바닐라베리 마이원 케이크', 'cake', 'standard_cake', 1, 2, '개', '일반', '케이크 냉동고'),
    p(10006, '헬로키티의 스위티 데이', 'cake', 'standard_cake', 0, 1, '개', '일반', '케이크 냉동고'),
    p(10007, '넌 내꺼야! 몬스터 볼 케이크', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10008, '브이 브이 이브이 케이크', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10009, '톡톡 프루티 와츄원', 'cake', 'standard_cake', 0, 1, '개', '일반', '케이크 냉동고'),
    p(10010, '바삭 쿠키 볼 와츄원', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10011, '오로라퍼플 쿠로미', 'cake', 'standard_cake', 0, 1, '개', '일반', '케이크 냉동고'),
    p(10012, '스카이블루 시나모롤', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10013, '골든옐로우 폼폼푸린', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10014, '초코별에서 온 엄마는 외계인', 'cake', 'standard_cake', 1, 2, '개', '일반', '케이크 냉동고'),
    p(10015, '스윗 하트 큐피드', 'cake', 'standard_cake', 0, 1, '개', '일반', '케이크 냉동고'),
    p(10016, '스윗 레드 하트', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10017, '스트로베리 요거트 프레지에', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10018, '포차코와 더 듬뿍 망고', 'cake', 'standard_cake', 0, 1, '개', '일반', '케이크 냉동고'),
    p(10019, '더 듬뿍 딸기 우유 케이크', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10020, '해-삐 잔망 루피', 'cake', 'standard_cake', 0, 1, '개', '일반', '케이크 냉동고'),
    p(10021, '진정한 티라미수 컬렉션', 'cake', 'collection_cake', 1, 1, '개', '컬렉션', '케이크 냉동고'),
    p(10022, '진정한 초콜릿 컬렉션', 'cake', 'collection_cake', 1, 1, '개', '컬렉션', '케이크 냉동고'),
    p(10023, '(Lessly Edition) 아몬드 봉봉 미니 케이크', 'cake', 'mini_cake', 0, 1, '개', '미니', '케이크 냉동고'),
    p(10024, '스노우 볼 와츄원', 'cake', 'standard_cake', 1, 1, '개', '일반', '케이크 냉동고'),
    p(10025, '골라먹는 27 큐브', 'cake', 'cube_cake', 1, 1, '개', '27 큐브', '케이크 냉동고'),
    p(10026, '리얼 초코 27 큐브', 'cake', 'cube_cake', 0, 1, '개', '27 큐브', '케이크 냉동고'),
    p(10027, '(Lessly Edition) 엄마는 외계인 미니 케이크', 'cake', 'mini_cake', 1, 1, '개', '미니', '케이크 냉동고'),
    p(11001, '두바이 크런치 모찌 초코 헤이즐넛', 'dessert', 'mochi', 3, 5, '개', '낱개', '디저트 냉동고'),
    p(11002, '두쫀아 모찌 피스타치오', 'dessert', 'mochi', 2, 5, '개', '낱개', '디저트 냉동고'),
    p(11003, '아몬드봉봉모찌', 'dessert', 'mochi', 4, 5, '개', '낱개', '디저트 냉동고'),
    p(11004, '아이스 모찌 소금우유', 'dessert', 'mochi', 3, 5, '개', '낱개', '디저트 냉동고'),
    p(11005, '아이스 모찌 그린티', 'dessert', 'mochi', 2, 5, '개', '낱개', '디저트 냉동고'),
    p(11006, '아이스 모찌 스트로베리', 'dessert', 'mochi', 5, 5, '개', '낱개', '디저트 냉동고'),
    p(11007, '아이스 모찌 초코바닐라', 'dessert', 'mochi', 4, 5, '개', '낱개', '디저트 냉동고'),
    p(11008, '아이스 모찌 크림치즈', 'dessert', 'mochi', 3, 5, '개', '낱개', '디저트 냉동고'),
    p(11101, '아이스 마카롱 크림브륄레', 'dessert', 'macaron', 3, 5, '개', '낱개', '디저트 냉동고'),
    p(11102, '아이스 마카롱 초콜릿 무스', 'dessert', 'macaron', 4, 5, '개', '낱개', '디저트 냉동고'),
    p(11103, '아이스 마카롱 쿠키앤크림', 'dessert', 'macaron', 2, 5, '개', '낱개', '디저트 냉동고'),
    // Retained as a disabled template because stores may still carry roll items,
    // although no roll was listed on the public BR dessert menu at refresh time.
    p(11201, '아이스크림 롤 (매장별 등록)', 'dessert', 'roll', 0, 1, '개', '매장 확인', '디저트 냉동고', null, false),
    p(11301, '아이스 바움쿠헨 아몬드봉봉', 'dessert', 'sandwich', 2, 3, '개', '낱개', '디저트 냉동고'),
    p(11302, '버터 쿠키 샌드 바닐라 카라멜', 'dessert', 'sandwich', 2, 3, '개', '낱개', '디저트 냉동고'),
    p(11303, '아이스 쿠키 샌드 바닐라', 'dessert', 'sandwich', 3, 3, '개', '낱개', '디저트 냉동고'),
    p(11304, '아이스 모나카 쫀떡 인절미', 'dessert', 'sandwich', 2, 3, '개', '낱개', '디저트 냉동고'),
    p(11305, '아이스 모나카 우유', 'dessert', 'sandwich', 1, 3, '개', '낱개', '디저트 냉동고'),
    p(11401, '피카츄 스틱바 바나나우유', 'dessert', 'stick_bar', 3, 4, '개', '낱개', '디저트 냉동고'),
    p(11402, '맥심 스틱바 슈프림골드', 'dessert', 'stick_bar', 3, 4, '개', '낱개', '디저트 냉동고'),
    p(11403, '맥심 스틱바 모카골드 마일드', 'dessert', 'stick_bar', 2, 4, '개', '낱개', '디저트 냉동고'),
    p(11404, '미니 아이스 스틱바 바닐라', 'dessert', 'stick_bar', 4, 4, '개', '낱개', '디저트 냉동고'),
    p(11601, '버즈의 인피니티 파워빔 선데', 'dessert', 'sundae', 2, 3, '개', '낱개', '디저트 냉동고'),
    p(11602, '우디의 후르츠 어드벤처 선데', 'dessert', 'sundae', 2, 3, '개', '낱개', '디저트 냉동고'),
    p(11603, '두바이st 선데', 'dessert', 'sundae', 1, 3, '개', '낱개', '디저트 냉동고'),
    p(11501, '블록팩 체리쥬빌레', 'dessert', 'block_pack', 2, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11502, '블록팩 슈팅스타', 'dessert', 'block_pack', 2, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11503, '블록팩 아몬드봉봉', 'dessert', 'block_pack', 3, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11504, '블록팩 엄마는외계인', 'dessert', 'block_pack', 2, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11505, '블록팩 쿠키앤크림', 'dessert', 'block_pack', 1, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11506, '블록팩 뉴욕치즈케이크', 'dessert', 'block_pack', 2, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11507, '블록팩 민트초코봉봉', 'dessert', 'block_pack', 1, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11508, '블록팩 이상한나라의솜사탕', 'dessert', 'block_pack', 2, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11509, '블록팩 바람과함께사라지다', 'dessert', 'block_pack', 1, 3, '개', '블록팩', '프리팩 냉동고'),
    p(11701, '레디팩 체리쥬빌레', 'dessert', 'ready_pack', 2, 3, '개', '레디팩', '프리팩 냉동고'),
    p(11702, '레디팩 오레오 쿠키 앤 크림', 'dessert', 'ready_pack', 2, 3, '개', '레디팩', '프리팩 냉동고'),
    p(11703, '레디팩 엄마는 외계인', 'dessert', 'ready_pack', 3, 3, '개', '레디팩', '프리팩 냉동고'),
    p(11704, '레디팩 아몬드 봉봉', 'dessert', 'ready_pack', 2, 3, '개', '레디팩', '프리팩 냉동고'),
    p(11705, '레디팩 소금 우유', 'dessert', 'ready_pack', 1, 3, '개', '레디팩', '프리팩 냉동고'),
    p(11706, '레디팩 베리베리 스트로베리', 'dessert', 'ready_pack', 2, 3, '개', '레디팩', '프리팩 냉동고'),
    p(11707, '레디팩 민트 초콜릿 칩', 'dessert', 'ready_pack', 2, 3, '개', '레디팩', '프리팩 냉동고'),
    p(11708, '레디팩 레인보우 샤베트', 'dessert', 'ready_pack', 1, 3, '개', '레디팩', '프리팩 냉동고'),
    p(11709, '레디팩 31요거트', 'dessert', 'ready_pack', 2, 3, '개', '레디팩', '프리팩 냉동고'),
    p(12001, '싱글 레귤러 컵', 'supply', 'cup', 8, 4, '팩', '115g', '포장재 선반', 50),
    p(12002, '싱글 킹 컵', 'supply', 'cup', 4, 3, '팩', '145g', '포장재 선반', 50),
    p(12003, '더블 주니어 컵', 'supply', 'cup', 5, 3, '팩', '150g', '포장재 선반', 50),
    p(12004, '트리플 주니어 컵', 'supply', 'cup', 3, 3, '팩', '225g', '포장재 선반', 50),
    p(12005, '더블 레귤러 컵', 'supply', 'cup', 4, 3, '팩', '230g', '포장재 선반', 50),
    p(12101, '컵 공용 뚜껑', 'supply', 'lid', 3, 4, '팩', '콘·컵', '포장재 선반', 50),
    p(12201, '슈가 콘', 'supply', 'cone', 2, 3, '박스', '공용', '콘 선반', 120),
    p(12202, '와플 콘', 'supply', 'cone', 1, 2, '박스', '공용', '콘 선반', 60),
    p(12301, '핑크 스푼', 'supply', 'spoon', 3, 3, '박스', '공용', '카운터 하부', 1000),
    p(12302, '케이크 스푼', 'supply', 'spoon', 2, 2, '박스', '케이크', '카운터 하부', 500),
    p(12401, '파인트 용기', 'supply', 'container', 5, 4, '팩', '336g', '포장재 선반', 25),
    p(12402, '쿼터 용기', 'supply', 'container', 4, 3, '팩', '643g', '포장재 선반', 25),
    p(12403, '패밀리 용기', 'supply', 'container', 3, 3, '팩', '989g', '포장재 선반', 20),
    p(12404, '하프갤론 용기', 'supply', 'container', 2, 2, '팩', '1,237g', '포장재 선반', 20),
    p(12501, '파인트 뚜껑', 'supply', 'lid', 5, 4, '팩', '336g 용기', '포장재 선반', 25),
    p(12502, '쿼터 뚜껑', 'supply', 'lid', 4, 3, '팩', '643g 용기', '포장재 선반', 25),
    p(12503, '패밀리 뚜껑', 'supply', 'lid', 3, 3, '팩', '989g 용기', '포장재 선반', 20),
    p(12504, '하프갤론 뚜껑', 'supply', 'lid', 2, 2, '팩', '1,237g 용기', '포장재 선반', 20),
    p(12601, '쇼핑백', 'supply', 'bag', 4, 3, '묶음', '공용', '포장재 선반', 50),
    p(12602, '보냉백', 'supply', 'bag', 12, 10, '개', '1시간 포장', '카운터 하부'),
    p(12701, '냅킨', 'supply', 'napkin', 2, 3, '박스', '공용', '카운터 하부', 1000),
    p(12801, '드라이아이스', 'supply', 'dry_ice', 15, 10, 'kg', '냉동 포장', '드라이아이스 보관함'),
    p(12901, '생일초 세트', 'supply', 'candle', 5, 3, '팩', '케이크', '케이크 부자재함', 20),
    p(12902, '케이크 칼', 'supply', 'candle', 2, 2, '팩', '케이크', '케이크 부자재함', 100),
  ]
}

function seedDB(): Tables {
  const storage: Row[] = [
    [1, 3], [2, 1], [3, 0], [5, 2], [6, 4], [9, 0], [10, 1], [13, 5], [17, 2], [19, 1],
  ].map(([fid, qty], i) => ({ id: i + 1, store_id: STORE_ID, flavor_id: fid, quantity: qty }))
  const products = seedInventoryProducts()

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
    inventory_products: products,
    inventory_snapshots: seedSnapshots(storage, products),
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

// ~2 weeks of daily inventory snapshots so the demo history calendar isn't empty.
// Today's snapshot equals current on-hand; earlier days carry gentle deterministic
// variation. Covers storage tubs + packaged products (what restore replays).
function seedSnapshots(storage: Row[], products: Row[]): Row[] {
  const rows: Row[] = []
  let id = 1
  const today = new Date()
  for (let back = 0; back < 14; back++) {
    const d = new Date(today)
    d.setDate(today.getDate() - back)
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const vary = (base: number, key: number) => (back === 0 ? base : Math.max(0, base + (((key + back) % 3) - 1)))
    for (const s of storage) {
      rows.push({ id: id++, store_id: STORE_ID, snapshot_date: date, item_type: 'storage', item_id: s.flavor_id, quantity: vary(s.quantity, s.flavor_id) })
    }
    for (const p of products) {
      rows.push({ id: id++, store_id: STORE_ID, snapshot_date: date, item_type: 'product', item_id: p.id, quantity: vary(p.quantity, p.id) })
    }
  }
  return rows
}

function seedActivity(): Row[] {
  // A few recent history entries so the 변경 기록 view isn't empty in the demo.
  const samples: [string, string, number][] = [
    ['새 통 교체: 민트초코칩', '재고', 1],
    ['창고 재고 변경: 딸기 3→2통', '재고', 3],
    ['와플 콘 재고 변경: 2→1박스', '재고', 5],
    ['케이크 빠른 실사 완료: 3개 품목 수정', '재고', 26],
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
    // Keep existing demo sessions compatible when new inventory domains are added.
    const inventoryNeedsUpgrade =
      !this.tables.inventory_products?.length ||
      !this.tables.inventory_products[0].subtype ||
      !this.tables.inventory_products.some((row) => row.category === 'supply') ||
      !this.tables.inventory_products.some((row) => row.name === '두바이 크런치 모찌 초코 헤이즐넛') ||
      !this.tables.inventory_products.some((row) => row.name === '아이스크림 롤 (매장별 등록)')
    const flavorCatalogNeedsUpgrade =
      !this.tables.flavors?.some((row) => row.name === '쵸파의 코튼캔디 크런치')
    const snapshotsNeedSeed = !this.tables.inventory_snapshots?.length
    if (inventoryNeedsUpgrade) this.tables.inventory_products = seedInventoryProducts()
    if (flavorCatalogNeedsUpgrade) this.tables.flavors = FLAVORS
    if (snapshotsNeedSeed) {
      this.tables.inventory_snapshots = seedSnapshots(
        this.tables.storage ?? [],
        this.tables.inventory_products ?? [],
      )
    }
    if (!saved || inventoryNeedsUpgrade || flavorCatalogNeedsUpgrade || snapshotsNeedSeed) this.persist()
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
