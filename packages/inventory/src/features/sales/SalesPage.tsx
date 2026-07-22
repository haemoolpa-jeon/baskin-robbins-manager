import { useMemo, useState } from 'react'
import { Package, ArrowUpToLine, IceCream, Flame } from 'lucide-react'
import { useApp } from '@shared/app/AppProvider'
import { useToast } from '@shared/components/Toast'
import { Spinner } from '@shared/components/Spinner'
import { Stepper } from '@shared/components/Stepper'
import { useFlavors } from '@/data/flavors'
import { useStorage } from '@/data/storage'
import { useCabinets } from '@/data/cabinets'
import { useConsumption } from '@/data/consumption'
import { useSetDefaultPar } from '@shared/data/store'
import { useLog } from '@shared/data/activity'
import { useProducts } from '@/data/products'
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_ORDER, type CabinetName, type Flavor } from '@/lib/types'
import '@/styles/sales.css'

const DAY = 24 * 60 * 60 * 1000

export function SalesPage() {
  const { storeId, defaultPar } = useApp()
  const toast = useToast()
  const log = useLog(storeId)
  const flavorsQ = useFlavors(storeId)
  const storageQ = useStorage(storeId)
  const cabinetsQ = useCabinets(storeId)
  const consumptionQ = useConsumption(storeId)
  const productsQ = useProducts(storeId)
  const setPar = useSetDefaultPar()

  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [checkedProducts, setCheckedProducts] = useState<Set<number>>(new Set())

  const flavors = flavorsQ.data ?? []
  const storage = storageQ.data ?? {}
  const cabinets = cabinetsQ.data
  const consumption = consumptionQ.data ?? []
  const products = productsQ.data ?? []
  const par = defaultPar

  const flavorsById = useMemo(() => new Map<number, Flavor>(flavors.map((f) => [f.id, f])), [flavors])

  const now = Date.now()
  const stats = useMemo(() => {
    let display = 0
    if (cabinets) {
      for (const c of ['cab1', 'cab2'] as CabinetName[]) display += cabinets[c].top.filter(Boolean).length
    }
    const totalStorage = Object.values(storage).reduce((a, b) => a + b, 0)
    const weekly = consumption.filter((r) => now - r.date < 7 * DAY).reduce((a, r) => a + r.qty, 0)
    return { display, totalStorage, flavorCount: flavors.length, weekly }
  }, [cabinets, storage, consumption, flavors, now])

  // Reorder list: available flavors below the target par level.
  const reorder = useMemo(() => {
    return flavors
      .filter((f) => f.available)
      .map((f) => ({ flavor: f, stock: storage[f.id] ?? 0, need: par - (storage[f.id] ?? 0) }))
      .filter((x) => x.need > 0)
      .sort((a, b) => b.need - a.need)
  }, [flavors, storage, par])

  const productReorder = useMemo(
    () =>
      products
        .filter((product) => product.available && product.quantity < product.par)
        .map((product) => ({ product, need: product.par - product.quantity }))
        .sort((a, b) => b.need - a.need),
    [products],
  )

  const productReorderByCategory = useMemo(
    () =>
      Object.fromEntries(
        PRODUCT_CATEGORY_ORDER.map((category) => [
          category,
          productReorder.filter(({ product }) => product.category === category),
        ]),
      ),
    [productReorder],
  )

  // 소진 순위 (last 30 days).
  const ranking = useMemo(() => {
    const byFlavor = new Map<number, number>()
    for (const r of consumption) {
      if (now - r.date < 30 * DAY) byFlavor.set(r.flavorId, (byFlavor.get(r.flavorId) ?? 0) + r.qty)
    }
    return [...byFlavor.entries()]
      .map(([id, qty]) => ({ flavor: flavorsById.get(id), qty }))
      .filter((x) => x.flavor)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [consumption, flavorsById, now])

  if (flavorsQ.isLoading || storageQ.isLoading || cabinetsQ.isLoading) {
    return (
      <div className="page">
        <Spinner center />
      </div>
    )
  }

  const toggleCheck = (id: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleProductCheck = (id: number) =>
    setCheckedProducts((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const applyPar = async (next: number) => {
    if (!storeId) return
    const clamped = Math.max(0, next)
    if (clamped === par) return
    try {
      await setPar.mutateAsync({ id: storeId, par: clamped })
      log(`목표 재고 변경: 각 맛 ${clamped}통`, '주문')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '변경 실패')
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">주문 · 재고</h1>

      <div className="stat-cards">
        <div className="stat-card">
          <Package className="stat-icon" size={26} />
          <div className="stat-value">{stats.totalStorage}</div>
          <div className="stat-label">창고 총 재고</div>
        </div>
        <div className="stat-card">
          <ArrowUpToLine className="stat-icon" size={26} />
          <div className="stat-value">{stats.display}</div>
          <div className="stat-label">진열중</div>
        </div>
        <div className="stat-card">
          <IceCream className="stat-icon" size={26} />
          <div className="stat-value">{stats.flavorCount}</div>
          <div className="stat-label">맛 종류</div>
        </div>
        <div className="stat-card">
          <Flame className="stat-icon" size={26} />
          <div className="stat-value">{stats.weekly}</div>
          <div className="stat-label">주간 소진(통)</div>
        </div>
      </div>

      {productsQ.isError ? (
        <div className="section-card">
          <div className="ok-note">상품 재고 목록을 준비 중입니다. 잠시 후 다시 확인해 주세요.</div>
        </div>
      ) : PRODUCT_CATEGORY_ORDER.map((category) => {
        const items = productReorderByCategory[category] ?? []
        return (
          <div className="section-card" key={category}>
            <div className="section-title">{PRODUCT_CATEGORY_LABELS[category]} 주문 준비</div>
            {items.length === 0 ? (
              <div className="ok-note">✅ 부족한 품목이 없습니다</div>
            ) : items.map(({ product, need }) => {
            const urgent = product.quantity === 0
            const isChecked = checkedProducts.has(product.id)
            return (
              <div
                key={product.id}
                className={`order-item ${urgent ? 'urgent' : ''} ${isChecked ? 'checked' : ''}`}
              >
                <button
                  className={`order-check ${isChecked ? 'on' : ''}`}
                  onClick={() => toggleProductCheck(product.id)}
                >
                  {isChecked ? '✓' : ''}
                </button>
                <div className="order-info">
                  <div className="order-name">
                    {urgent && '🚨 '}{product.name}
                  </div>
                  <div className="order-reason">
                    현재 {product.quantity}{product.unit} · 목표 {product.par}{product.unit}
                    {product.packSize ? ` · ${product.unit}당 ${product.packSize}개` : ''}
                  </div>
                </div>
                <div className={`order-qty ${urgent ? 'urgent' : ''}`}>+{need}{product.unit}</div>
              </div>
            )
            })}
          </div>
        )
      })}

      <div className="section-card">
        <div className="section-head">
          <div className="section-title">🍨 아이스크림 주문</div>
          <div className="par-inline">
            <span className="label">목표</span>
            <Stepper size="sm" ariaLabel="목표 재고 통 수" value={par} onChange={applyPar} />
            <span className="label">통</span>
          </div>
        </div>
        <div className="par-hint">창고 재고가 {par}통보다 적은 맛을 아래에 표시합니다</div>
        {reorder.length === 0 ? (
          <div className="ok-note">✅ 모든 맛의 재고가 충분합니다!</div>
        ) : (
          reorder.map(({ flavor, stock, need }) => {
            const urgent = stock === 0
            const isChecked = checked.has(flavor.id)
            return (
              <div
                key={flavor.id}
                className={`order-item ${urgent ? 'urgent' : ''} ${isChecked ? 'checked' : ''}`}
              >
                <button className={`order-check ${isChecked ? 'on' : ''}`} onClick={() => toggleCheck(flavor.id)}>
                  {isChecked ? '✓' : ''}
                </button>
                <div className="order-info">
                  <div className="order-name">
                    {urgent && '🚨 '}
                    {flavor.name}
                  </div>
                  <div className="order-reason">
                    창고 {stock}통{urgent ? ' · 품절!' : ''}
                  </div>
                </div>
                <div className={`order-qty ${urgent ? 'urgent' : ''}`}>+{need}통</div>
              </div>
            )
          })
        )}
      </div>

      <div className="section-card">
        <div className="section-title">🔥 많이 나간 맛 (최근 30일)</div>
        {ranking.length === 0 ? (
          <div className="ok-note">아직 소진 기록이 없습니다</div>
        ) : (
          ranking.map((r, i) => (
            <div className="rank-item" key={r.flavor!.id}>
              <span className="rank-num">{i + 1}</span>
              <span className="rank-name">{r.flavor!.name}</span>
              <span className="rank-qty">{r.qty}통</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
