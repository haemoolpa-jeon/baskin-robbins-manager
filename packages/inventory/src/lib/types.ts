// ---------------------------------------------------------------------------
// Inventory domain types (camelCase, app-facing). DB rows are snake_case and
// mapped to these in the data hooks (src/data/*). Keeping one canonical shape
// here is the guardrail that the legacy JS lacked.
// ---------------------------------------------------------------------------

export type FlavorType = 'fixed' | 'seasonal' | 'limited' | 'special'

export interface Flavor {
  id: number
  name: string
  color: string
  type: FlavorType
  available: boolean
  lotNumber: string
  expiryDate: string | null
  storageLocation: string
}

/** One occupied cabinet position. `null` = empty slot. */
export interface Slot {
  flavorId: number
  level: number // 0–100 (% remaining)
}

export type CabinetName = 'cab1' | 'cab2'
export type RowName = 'top' | 'bottom'

/** cab[name][row] is a fixed-length array of 16 (Slot | null). */
export type Cabinets = Record<CabinetName, Record<RowName, (Slot | null)[]>>

/** flavorId -> tub count in 창고 */
export type Storage = Record<number, number>

export type ProductCategory = 'cake' | 'dessert' | 'supply'

/** Packaged products counted as whole sellable units, separate from ice-cream tubs. */
export interface InventoryProduct {
  id: number
  name: string
  category: ProductCategory
  subtype: string
  quantity: number
  par: number
  unit: string
  sizeLabel: string
  location: string
  expiryDate: string | null
  packSize: number | null
  available: boolean
}

/** A tub-consumption record (legacy "sales" — a replaced/emptied tub). */
export interface ConsumptionRecord {
  flavorId: number
  qty: number
  date: number // epoch ms
}

export const FLAVOR_TYPE_ORDER: FlavorType[] = ['fixed', 'seasonal', 'limited', 'special']

export const FLAVOR_TYPE_LABELS: Record<FlavorType, string> = {
  fixed: '🔵 상시',
  seasonal: '🟠 시즌',
  limited: '🔴 한정',
  special: '🟣 스페셜',
}

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = ['cake', 'dessert', 'supply']

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  cake: '🎂 케이크',
  dessert: '🍡 디저트',
  supply: '🥄 소모품',
}

export const PRODUCT_SUBTYPE_OPTIONS: Record<ProductCategory, { value: string; label: string }[]> = {
  cake: [
    { value: 'standard_cake', label: '일반 케이크' },
    { value: 'mini_cake', label: '미니 케이크' },
    { value: 'cube_cake', label: '큐브 케이크' },
    { value: 'collection_cake', label: '컬렉션 케이크' },
    { value: 'other', label: '기타 케이크' },
  ],
  dessert: [
    { value: 'mochi', label: '아이스 모찌' },
    { value: 'macaron', label: '아이스 마카롱' },
    { value: 'roll', label: '아이스크림 롤' },
    { value: 'sandwich', label: '샌드·모나카' },
    { value: 'stick_bar', label: '스틱바' },
    { value: 'block_pack', label: '블록팩' },
    { value: 'ready_pack', label: '레디팩·프리팩' },
    { value: 'sundae', label: '선데' },
    { value: 'other', label: '기타 디저트' },
  ],
  supply: [
    { value: 'cup', label: '컵' },
    { value: 'lid', label: '뚜껑' },
    { value: 'cone', label: '콘' },
    { value: 'spoon', label: '스푼' },
    { value: 'container', label: '포장 용기' },
    { value: 'bag', label: '쇼핑백·보냉백' },
    { value: 'napkin', label: '냅킨' },
    { value: 'dry_ice', label: '드라이아이스' },
    { value: 'candle', label: '초·케이크 부자재' },
    { value: 'other', label: '기타 소모품' },
  ],
}

export function productSubtypeLabel(category: ProductCategory, subtype: string): string {
  return PRODUCT_SUBTYPE_OPTIONS[category].find((option) => option.value === subtype)?.label ?? '기타'
}
