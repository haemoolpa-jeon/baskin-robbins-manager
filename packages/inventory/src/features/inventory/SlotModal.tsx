import { useMemo, useState } from 'react'
import { Modal } from '@shared/components/Modal'
import { useToast } from '@shared/components/Toast'
import { useSetSlot, type SlotPos } from '@/data/cabinets'
import { useSetStorage } from '@/data/storage'
import { useRecordConsumption } from '@/data/consumption'
import { useLog } from '@shared/data/activity'
import {
  FLAVOR_TYPE_LABELS,
  FLAVOR_TYPE_ORDER,
  type Flavor,
  type FlavorType,
  type Slot,
  type Storage,
} from '@/lib/types'

interface Props {
  pos: SlotPos
  slot: Slot | null
  flavors: Flavor[]
  storage: Storage
  storeId: string | null
  onClose: () => void
  onMove: () => void
}

const posLabel = (pos: SlotPos) =>
  `${pos.cabinet === 'cab1' ? '캐비닛1' : '캐비닛2'} ${pos.row === 'top' ? '위(진열)' : '아래(대기)'} ${pos.position + 1}번`

const LEVELS = [0, 25, 50, 75, 100]

export function SlotModal({ pos, slot, flavors, storage, storeId, onClose, onMove }: Props) {
  const toast = useToast()
  const log = useLog(storeId)
  const setSlot = useSetSlot(storeId)
  const setStorage = useSetStorage(storeId)
  const recordConsumption = useRecordConsumption(storeId)
  const slotFlavorName = slot ? (flavors.find((f) => f.id === slot.flavorId)?.name ?? '맛') : ''

  if (!slot) {
    return (
      <AssignPicker
        pos={pos}
        flavors={flavors}
        storage={storage}
        onClose={onClose}
        busy={setSlot.isPending}
        onPick={async (f) => {
          try {
            await setSlot.mutateAsync({ pos, slot: { flavorId: f.id, level: 100 } })
            const have = storage[f.id] ?? 0
            if (have > 0) await setStorage.mutateAsync({ flavorId: f.id, quantity: have - 1 })
            log(`진열 추가: ${f.name} (${posLabel(pos)})`, '재고')
            toast.success(`${f.name} 진열`)
            onClose()
          } catch (e) {
            toast.error(e instanceof Error ? e.message : '저장 실패')
          }
        }}
      />
    )
  }

  return (
    <FilledSlot
      pos={pos}
      slot={slot}
      flavor={flavors.find((f) => f.id === slot.flavorId)}
      busy={setSlot.isPending}
      onClose={onClose}
      onMove={onMove}
      onSaveLevel={async (level) => {
        try {
          await setSlot.mutateAsync({ pos, slot: { ...slot, level } })
          log(`잔량 변경: ${slotFlavorName} ${level}%`, '재고')
          onClose()
        } catch (e) {
          toast.error(e instanceof Error ? e.message : '저장 실패')
        }
      }}
      onReplace={async () => {
        try {
          if (slot.level < 100) await recordConsumption.mutateAsync({ flavorId: slot.flavorId })
          await setSlot.mutateAsync({ pos, slot: { ...slot, level: 100 } })
          const have = storage[slot.flavorId] ?? 0
          if (have > 0) await setStorage.mutateAsync({ flavorId: slot.flavorId, quantity: have - 1 })
          log(`새 통 교체: ${slotFlavorName}`, '재고')
          toast.success('새 통으로 교체했습니다')
          onClose()
        } catch (e) {
          toast.error(e instanceof Error ? e.message : '교체 실패')
        }
      }}
      storageQty={storage[slot.flavorId] ?? 0}
      onEmpty={async () => {
        try {
          await setSlot.mutateAsync({ pos, slot: null })
          log(`진열 비움: ${slotFlavorName} (${posLabel(pos)})`, '재고')
          onClose()
        } catch (e) {
          toast.error(e instanceof Error ? e.message : '비우기 실패')
        }
      }}
    />
  )
}

// --- Empty slot: pick a flavor ---------------------------------------------
function AssignPicker({
  pos,
  flavors,
  storage,
  onClose,
  onPick,
  busy,
}: {
  pos: SlotPos
  flavors: Flavor[]
  storage: Storage
  onClose: () => void
  onPick: (f: Flavor) => void
  busy: boolean
}) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<FlavorType | 'all'>('all')

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = flavors.filter((f) => {
      if (!f.available) return false
      if (type !== 'all' && f.type !== type) return false
      if (q && !f.name.toLowerCase().includes(q)) return false
      return true
    })
    return FLAVOR_TYPE_ORDER.map((t) => ({ type: t, items: filtered.filter((f) => f.type === t) })).filter(
      (g) => g.items.length > 0,
    )
  }, [flavors, query, type])

  return (
    <Modal title={`📍 ${posLabel(pos)}`} subtitle="진열할 맛을 선택하세요" onClose={onClose}>
      <input
        className="input assign-search"
        placeholder="🔍 맛 검색…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="type-tabs">
        <button className={`type-tab ${type === 'all' ? 'active' : ''}`} onClick={() => setType('all')}>
          전체
        </button>
        {FLAVOR_TYPE_ORDER.map((t) => (
          <button key={t} className={`type-tab ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
            {FLAVOR_TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="flavor-list">
        {grouped.length === 0 && <div className="no-result">검색 결과가 없습니다</div>}
        {grouped.map((g) => (
          <div key={g.type}>
            {type === 'all' && <div className="type-section">{FLAVOR_TYPE_LABELS[g.type]}</div>}
            {g.items.map((f) => (
              <button
                key={f.id}
                className="flv-btn"
                style={{ ['--slot-color' as string]: f.color }}
                disabled={busy || (storage[f.id] ?? 0) <= 0}
                onClick={() => onPick(f)}
              >
                <span style={{ fontSize: 24 }}>🍨</span>
                <span className="flv-name">{f.name}</span>
                <span className={`flv-stock ${(storage[f.id] ?? 0) <= 0 ? 'empty' : ''}`}>
                  {(storage[f.id] ?? 0) > 0 ? `창고 ${storage[f.id]}통` : '재고 없음'}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  )
}

// --- Filled slot: adjust level / replace / empty / move --------------------
function FilledSlot({
  pos,
  slot,
  flavor,
  onClose,
  onSaveLevel,
  onReplace,
  onEmpty,
  onMove,
  busy,
  storageQty,
}: {
  pos: SlotPos
  slot: Slot
  flavor?: Flavor
  onClose: () => void
  onSaveLevel: (level: number) => void
  onReplace: () => void
  onEmpty: () => void
  onMove: () => void
  busy: boolean
  storageQty: number
}) {
  const [level, setLevel] = useState(slot.level)

  return (
    <Modal
      title={`🍨 ${flavor?.name ?? '알 수 없음'}`}
      subtitle={`📍 ${posLabel(pos)}`}
      onClose={onClose}
      actions={
        <>
          <button className="btn" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={() => onSaveLevel(level)} disabled={busy}>
            저장
          </button>
        </>
      }
    >
      <div className="level-control">
        <div className="level-bar">
          <div className="level-bar-fill" style={{ width: `${level}%` }} />
        </div>
        <div className="level-presets">
          {LEVELS.map((v) => (
            <button key={v} className={level === v ? 'active' : ''} onClick={() => setLevel(v)}>
              {v}%
            </button>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div className="level-value">{level}%</div>
      </div>

      <div className="slot-action-row">
        <button className="btn btn-secondary" onClick={onReplace} disabled={busy || storageQty <= 0}>
          {storageQty > 0 ? `🔄 새 통으로 교체 (창고 ${storageQty})` : '창고 재고 없음'}
        </button>
      </div>
      <div className="slot-action-row">
        <button className="btn" onClick={onMove}>
          ↔️ 위치 이동
        </button>
        <button className="btn btn-danger" onClick={onEmpty} disabled={busy}>
          🗑️ 비우기
        </button>
      </div>
    </Modal>
  )
}
