import { useMemo, useState } from 'react'
import { useApp } from '@/app/AppProvider'
import { useLog } from '@/data/activity'
import { useToast } from '@/components/Toast'
import { Spinner } from '@/components/Spinner'
import { useFlavors } from '@/data/flavors'
import { useCabinets, useSwapSlots, type SlotPos } from '@/data/cabinets'
import { useStorage } from '@/data/storage'
import type { CabinetName, Flavor } from '@/lib/types'
import { CabinetView } from './CabinetView'
import { StorageView } from './StorageView'
import { SlotModal } from './SlotModal'
import { StorageItemModal } from './StorageItemModal'
import { AddFlavorModal } from './AddFlavorModal'
import '@/styles/inventory.css'

type Tab = CabinetName | 'storage'
type ModalState =
  | { kind: 'slot'; pos: SlotPos }
  | { kind: 'storage'; flavorId: number }
  | { kind: 'addFlavor' }
  | null

export function InventoryPage() {
  const { storeId } = useApp()
  const log = useLog(storeId)
  const toast = useToast()
  const flavorsQ = useFlavors(storeId)
  const cabinetsQ = useCabinets(storeId)
  const storageQ = useStorage(storeId)
  const swapSlots = useSwapSlots(storeId)

  const [tab, setTab] = useState<Tab>('cab1')
  const [moveSource, setMoveSource] = useState<SlotPos | null>(null)
  const [modal, setModal] = useState<ModalState>(null)

  const flavors = flavorsQ.data ?? []
  const cabinets = cabinetsQ.data
  const storage = storageQ.data ?? {}
  const flavorsById = useMemo(() => new Map<number, Flavor>(flavors.map((f) => [f.id, f])), [flavors])

  const counts = useMemo(() => {
    let display = 0
    let waiting = 0
    if (cabinets) {
      for (const c of ['cab1', 'cab2'] as CabinetName[]) {
        display += cabinets[c].top.filter(Boolean).length
        waiting += cabinets[c].bottom.filter(Boolean).length
      }
    }
    const storageTotal = Object.values(storage).reduce((a, b) => a + b, 0)
    return { display, waiting, storageTotal }
  }, [cabinets, storage])

  if (flavorsQ.isLoading || cabinetsQ.isLoading || storageQ.isLoading) {
    return (
      <div className="page">
        <Spinner center />
      </div>
    )
  }
  if (flavorsQ.isError || cabinetsQ.isError || storageQ.isError || !cabinets) {
    return (
      <div className="page">
        <h1 className="page-title">🍨 재고 관리</h1>
        <div className="card" style={{ textAlign: 'center', color: 'var(--danger)' }}>
          데이터를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.
        </div>
      </div>
    )
  }

  const handleSlotTap = async (pos: SlotPos) => {
    if (moveSource) {
      const same =
        moveSource.cabinet === pos.cabinet &&
        moveSource.row === pos.row &&
        moveSource.position === pos.position
      if (same) {
        setMoveSource(null)
        return
      }
      const slotA = cabinets[moveSource.cabinet][moveSource.row][moveSource.position]
      const slotB = cabinets[pos.cabinet][pos.row][pos.position]
      try {
        await swapSlots.mutateAsync({ a: moveSource, b: pos, slotA, slotB })
        const nameA = slotA ? (flavorsById.get(slotA.flavorId)?.name ?? '') : '빈 칸'
        log(`진열 위치 이동: ${nameA}`, '재고')
        toast.success('위치를 옮겼습니다')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '이동 실패')
      }
      setMoveSource(null)
      return
    }
    setModal({ kind: 'slot', pos })
  }

  const activeSlot =
    modal?.kind === 'slot' ? cabinets[modal.pos.cabinet][modal.pos.row][modal.pos.position] : null

  return (
    <div className="page">
      <h1 className="page-title">🍨 재고 관리</h1>

      <div className="inv-summary">
        <div className="sum-item">
          <span className="sum-icon">🔝</span>
          <span className="sum-val">{counts.display}/32</span>
          <span className="sum-lbl">진열중</span>
        </div>
        <div className="sum-item">
          <span className="sum-icon">⬇️</span>
          <span className="sum-val">{counts.waiting}/32</span>
          <span className="sum-lbl">대기</span>
        </div>
        <div className="sum-item">
          <span className="sum-icon">📦</span>
          <span className="sum-val">{counts.storageTotal}</span>
          <span className="sum-lbl">창고</span>
        </div>
      </div>

      <div className="cab-tabs">
        <button className={`cab-tab ${tab === 'cab1' ? 'active' : ''}`} onClick={() => setTab('cab1')}>
          캐비닛 1
        </button>
        <button className={`cab-tab ${tab === 'cab2' ? 'active' : ''}`} onClick={() => setTab('cab2')}>
          캐비닛 2
        </button>
        <button
          className={`cab-tab storage-tab ${tab === 'storage' ? 'active' : ''}`}
          onClick={() => setTab('storage')}
        >
          📦 창고
        </button>
      </div>

      {moveSource && (
        <div className="move-banner">
          <span>옮길 위치를 선택하세요</span>
          <button className="btn" style={{ minHeight: 36, padding: '0 12px' }} onClick={() => setMoveSource(null)}>
            취소
          </button>
        </div>
      )}

      {tab === 'storage' ? (
        <StorageView
          flavors={flavors}
          storage={storage}
          canEdit
          onItemTap={(flavorId) => setModal({ kind: 'storage', flavorId })}
          onAdd={() => setModal({ kind: 'addFlavor' })}
        />
      ) : (
        <CabinetView
          cabinet={tab}
          cabinets={cabinets}
          flavorsById={flavorsById}
          moveSource={moveSource}
          onSlotTap={handleSlotTap}
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
          onMove={() => {
            setMoveSource(modal.pos)
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'storage' &&
        (() => {
          const f = flavorsById.get(modal.flavorId)
          return f ? (
            <StorageItemModal
              flavor={f}
              currentQty={storage[f.id] ?? 0}
              storeId={storeId}
              onClose={() => setModal(null)}
            />
          ) : null
        })()}
      {modal?.kind === 'addFlavor' && (
        <AddFlavorModal storeId={storeId} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
