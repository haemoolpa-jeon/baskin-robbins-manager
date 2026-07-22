import { useEffect, useMemo, useRef, useState } from 'react'
import { CakeSlice, IceCreamBowl, PackageOpen, PackagePlus, Utensils } from 'lucide-react'
import { useApp } from '@shared/app/AppProvider'
import { useLog } from '@shared/data/activity'
import { useToast } from '@shared/components/Toast'
import { Spinner } from '@shared/components/Spinner'
import { Segmented } from '@shared/components/Segmented'
import { ErrorState } from '@shared/components/ErrorState'
import { useFlavors } from '@/data/flavors'
import { useCabinets, useSwapSlots, type SlotPos } from '@/data/cabinets'
import { useStorage } from '@/data/storage'
import { useProducts } from '@/data/products'
import { useWriteSnapshot } from '@/data/snapshots'
import type { CabinetName, Flavor, InventoryProduct, ProductCategory } from '@/lib/types'
import { CabinetView } from './CabinetView'
import { StorageView } from './StorageView'
import { SlotModal } from './SlotModal'
import { StorageItemModal } from './StorageItemModal'
import { AddFlavorModal } from './AddFlavorModal'
import { InventoryCountModal } from './InventoryCountModal'
import { ProductInventoryView } from './ProductInventoryView'
import { ProductModal } from './ProductModal'
import { ProductCountModal } from './ProductCountModal'
import '@/styles/inventory.css'

type Domain = 'icecream' | ProductCategory
type IceView = CabinetName | 'storage'
type ModalState =
  | { kind: 'slot'; pos: SlotPos }
  | { kind: 'storage'; flavorId: number }
  | { kind: 'addFlavor' }
  | { kind: 'count' }
  | { kind: 'product'; product: InventoryProduct | null; category: ProductCategory }
  | { kind: 'productCount'; category: ProductCategory }
  | null

const DOMAINS: { key: Domain; label: string; Icon: typeof IceCreamBowl }[] = [
  { key: 'icecream', label: '아이스크림', Icon: IceCreamBowl },
  { key: 'cake', label: '케이크', Icon: CakeSlice },
  { key: 'dessert', label: '디저트', Icon: PackageOpen },
  { key: 'supply', label: '소모품', Icon: Utensils },
]

export function InventoryPage() {
  const { storeId, defaultPar } = useApp()
  const log = useLog(storeId)
  const toast = useToast()
  const flavorsQ = useFlavors(storeId)
  const cabinetsQ = useCabinets(storeId)
  const storageQ = useStorage(storeId)
  const productsQ = useProducts(storeId)
  const swapSlots = useSwapSlots(storeId)
  const writeSnapshot = useWriteSnapshot(storeId)
  const lastSnapSig = useRef('')

  const [domain, setDomain] = useState<Domain>('icecream')
  const [iceView, setIceView] = useState<IceView>('storage')
  const [moveSource, setMoveSource] = useState<SlotPos | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [shortageOnly, setShortageOnly] = useState(false)

  const flavors = flavorsQ.data ?? []
  const cabinets = cabinetsQ.data
  const storage = storageQ.data ?? {}
  const products = productsQ.data ?? []
  const flavorsById = useMemo(() => new Map<number, Flavor>(flavors.map((flavor) => [flavor.id, flavor])), [flavors])

  // Auto-capture today's inventory snapshot, and refresh it whenever quantities
  // change today, so the history calendar always reflects the latest counts.
  useEffect(() => {
    if (!storeId) return
    if (flavorsQ.isLoading || storageQ.isLoading || productsQ.isLoading) return
    if (flavorsQ.isError || storageQ.isError || productsQ.isError) return
    const sig = JSON.stringify([storage, products.map((p) => [p.id, p.quantity])])
    if (sig === lastSnapSig.current) return
    lastSnapSig.current = sig
    writeSnapshot.mutate({ storage, products })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    storeId,
    storage,
    products,
    flavorsQ.isLoading,
    storageQ.isLoading,
    productsQ.isLoading,
    flavorsQ.isError,
    storageQ.isError,
    productsQ.isError,
  ])

  const counts = useMemo(() => {
    const availableFlavors = flavors.filter((flavor) => flavor.available)
    const iceLow = availableFlavors.filter((flavor) => (storage[flavor.id] ?? 0) < (flavor.par ?? defaultPar)).length
    const productLow = (category: ProductCategory) =>
      products.filter((product) => product.category === category && product.available && product.quantity < product.par).length
    return {
      iceLow,
      cakeLow: productLow('cake'),
      dessertLow: productLow('dessert'),
      supplyLow: productLow('supply'),
      totalLow: iceLow + productLow('cake') + productLow('dessert') + productLow('supply'),
      storageTotal: Object.values(storage).reduce((sum, quantity) => sum + quantity, 0),
    }
  }, [defaultPar, flavors, products, storage])

  if (flavorsQ.isLoading || cabinetsQ.isLoading || storageQ.isLoading) {
    return <div className="page"><Spinner center /></div>
  }
  if (flavorsQ.isError || cabinetsQ.isError || storageQ.isError || !cabinets) {
    return (
      <div className="page">
        <h1 className="page-title">재고 관리</h1>
        <ErrorState onRetry={() => { flavorsQ.refetch(); cabinetsQ.refetch(); storageQ.refetch() }} />
      </div>
    )
  }

  const lowForDomain = (key: Domain) => {
    if (key === 'icecream') return counts.iceLow
    if (key === 'cake') return counts.cakeLow
    if (key === 'dessert') return counts.dessertLow
    return counts.supplyLow
  }

  const handleSlotTap = async (pos: SlotPos) => {
    if (moveSource) {
      const same =
        moveSource.cabinet === pos.cabinet &&
        moveSource.row === pos.row &&
        moveSource.position === pos.position
      if (same) return setMoveSource(null)
      const slotA = cabinets[moveSource.cabinet][moveSource.row][moveSource.position]
      const slotB = cabinets[pos.cabinet][pos.row][pos.position]
      try {
        await swapSlots.mutateAsync({ a: moveSource, b: pos, slotA, slotB })
        const name = slotA ? (flavorsById.get(slotA.flavorId)?.name ?? '') : '빈 칸'
        log(`진열 위치 이동: ${name}`, '재고')
        toast.success('위치를 옮겼습니다')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '이동 실패')
      }
      setMoveSource(null)
      return
    }
    setModal({ kind: 'slot', pos })
  }

  const activeSlot =
    modal?.kind === 'slot' ? cabinets[modal.pos.cabinet][modal.pos.row][modal.pos.position] : null

  return (
    <div className="page inventory-page">
      <div className="inventory-page-heading">
        <div>
          <h1 className="page-title">재고 관리</h1>
          <p>부족한 품목 <strong>{counts.totalLow}개</strong>를 확인하세요</p>
        </div>
      </div>

      <div className="inventory-domain-tabs" role="tablist" aria-label="재고 종류">
        {DOMAINS.map(({ key, label, Icon }) => {
          const low = lowForDomain(key)
          return (
            <button
              key={key}
              role="tab"
              aria-selected={domain === key}
              className={domain === key ? 'active' : ''}
              onClick={() => {
                setDomain(key)
                setMoveSource(null)
              }}
            >
              <Icon size={24} />
              <span>{label}</span>
              {low > 0 && <strong>{low}</strong>}
            </button>
          )
        })}
      </div>

      {domain === 'icecream' ? (
        <section className="domain-workspace domain-icecream">
          <div className="domain-heading">
            <div>
              <h2>🍨 아이스크림</h2>
              <p>창고 {counts.storageTotal}통 · 부족 {counts.iceLow}개 맛</p>
            </div>
            <button className="btn btn-primary domain-add" onClick={() => setModal({ kind: 'addFlavor' })}>
              <PackagePlus size={20} /> 추가
            </button>
          </div>
          <Segmented
            ariaLabel="아이스크림 보기"
            value={iceView}
            onChange={setIceView}
            options={[
              { value: 'storage', label: '창고 재고' },
              { value: 'cab1', label: '캐비닛 1' },
              { value: 'cab2', label: '캐비닛 2' },
            ]}
          />

          {moveSource && (
            <div className="move-banner">
              <span>옮길 위치를 선택하세요</span>
              <button className="btn" onClick={() => setMoveSource(null)}>취소</button>
            </div>
          )}

          {iceView === 'storage' ? (
            <StorageView
              flavors={flavors}
              storage={storage}
              canEdit
              targetPar={defaultPar}
              shortageOnly={shortageOnly}
              onShortageOnlyChange={setShortageOnly}
              onItemTap={(flavorId) => setModal({ kind: 'storage', flavorId })}
              onCount={() => setModal({ kind: 'count' })}
            />
          ) : (
            <>
              {counts.iceLow > 0 && (
                <button className="inventory-alert" onClick={() => { setShortageOnly(true); setIceView('storage') }}>
                  <span className="inventory-alert-icon">!</span>
                  <span><strong>창고 부족 재고 {counts.iceLow}개</strong><small>눌러서 바로 확인</small></span>
                  <span className="inventory-alert-link">보기 ›</span>
                </button>
              )}
              <CabinetView
                cabinet={iceView}
                cabinets={cabinets}
                flavorsById={flavorsById}
                moveSource={moveSource}
                onSlotTap={handleSlotTap}
              />
            </>
          )}
        </section>
      ) : productsQ.isLoading ? (
        <Spinner center />
      ) : productsQ.isError ? (
        <ErrorState
          title="이 목록을 준비 중입니다"
          hint="잠시 후 다시 확인해 주세요. 계속 보이면 매장 설정을 점검해 주세요."
          onRetry={() => productsQ.refetch()}
        />
      ) : (
        <ProductInventoryView
          category={domain}
          products={products}
          onEdit={(product) => setModal({ kind: 'product', product, category: domain })}
          onAdd={() => setModal({ kind: 'product', product: null, category: domain })}
          onCount={() => setModal({ kind: 'productCount', category: domain })}
        />
      )}

      {modal?.kind === 'slot' && (
        <SlotModal
          pos={modal.pos}
          slot={activeSlot}
          flavors={flavors}
          storage={storage}
          storeId={storeId}
          onClose={() => setModal(null)}
          onMove={() => { setMoveSource(modal.pos); setModal(null) }}
        />
      )}
      {modal?.kind === 'storage' && (() => {
        const flavor = flavorsById.get(modal.flavorId)
        return flavor ? (
          <StorageItemModal
            flavor={flavor}
            currentQty={storage[flavor.id] ?? 0}
            storeId={storeId}
            onClose={() => setModal(null)}
          />
        ) : null
      })()}
      {modal?.kind === 'addFlavor' && <AddFlavorModal storeId={storeId} onClose={() => setModal(null)} />}
      {modal?.kind === 'count' && (
        <InventoryCountModal
          flavors={flavors}
          storage={storage}
          storeId={storeId}
          targetPar={defaultPar}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'product' && (
        <ProductModal
          product={modal.product}
          defaultCategory={modal.category}
          storeId={storeId}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'productCount' && (
        <ProductCountModal
          products={products}
          category={modal.category}
          storeId={storeId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
