import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Modal } from '@shared/components/Modal'
import { MonthPicker } from '@shared/components/MonthPicker'
import { Calendar } from '@shared/components/Calendar'
import { Spinner } from '@shared/components/Spinner'
import { EmptyState } from '@shared/components/EmptyState'
import { useConfirm } from '@shared/components/ConfirmDialog'
import { useToast } from '@shared/components/Toast'
import { useApp } from '@shared/app/AppProvider'
import { useLog } from '@shared/data/activity'
import { currentYearMonth, parseDate } from '@shared/lib/date'
import { useFlavors } from '@/data/flavors'
import { useProducts } from '@/data/products'
import { useStorage } from '@/data/storage'
import {
  useSnapshot,
  useSnapshotDates,
  useRestoreSnapshot,
  useWriteSnapshot,
  todayIso,
} from '@/data/snapshots'
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_ORDER, type ProductCategory } from '@/lib/types'

export function InventoryCalendarModal({ onClose }: { onClose: () => void }) {
  const { storeId } = useApp()
  const confirm = useConfirm()
  const toast = useToast()
  const log = useLog(storeId)

  const flavors = useFlavors(storeId).data ?? []
  const products = useProducts(storeId).data ?? []
  const storage = useStorage(storeId).data ?? {}

  const today = todayIso()
  const [ym, setYm] = useState(currentYearMonth())
  const [selected, setSelected] = useState<string | null>(today)

  const datesQ = useSnapshotDates(storeId)
  const dayQ = useSnapshot(storeId, selected)
  const restore = useRestoreSnapshot(storeId)
  const writeSnapshot = useWriteSnapshot(storeId)

  const dates = datesQ.data ?? new Set<string>()
  const flavorName = useMemo(() => new Map(flavors.map((f) => [f.id, f.name])), [flavors])
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const rows = dayQ.data ?? []
  const totals = useMemo(() => {
    let ice = 0
    const byCat: Record<ProductCategory, number> = { cake: 0, dessert: 0, supply: 0 }
    for (const r of rows) {
      if (r.itemType === 'storage') ice += r.quantity
      else {
        const p = productById.get(r.itemId)
        if (p) byCat[p.category] += r.quantity
      }
    }
    return { ice, byCat }
  }, [rows, productById])

  const dayLabel = selected ? `${parseDate(selected).getMonth() + 1}월 ${parseDate(selected).getDate()}일` : ''
  const busy = restore.isPending || writeSnapshot.isPending

  const onRestore = async () => {
    if (!selected || rows.length === 0) return
    const ok = await confirm({
      title: `${dayLabel} 재고로 되돌리기`,
      message: '현재 재고를 이 날짜의 기록으로 바꿉니다. 되돌리기 직전 상태는 오늘 날짜 기록에 저장됩니다.',
      danger: true,
      confirmText: '되돌리기',
    })
    if (!ok) return
    try {
      // Capture current state under today first so the restore is reversible.
      await writeSnapshot.mutateAsync({ storage, products })
      await restore.mutateAsync(rows)
      log(`재고 되돌리기: ${selected} 기록으로 복원`, '재고')
      toast.success(`${dayLabel} 재고로 되돌렸습니다`)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '되돌리기 실패')
    }
  }

  return (
    <Modal
      title="재고 달력"
      subtitle="날짜를 눌러 그날의 재고를 확인하세요"
      onClose={onClose}
      actions={
        <button className="btn btn-block" onClick={onClose}>
          닫기
        </button>
      }
    >
      <MonthPicker ym={ym} onChange={setYm} />
      <Calendar
        ym={ym}
        selectedIso={selected}
        onDayTap={setSelected}
        isMarked={(iso) => dates.has(iso)}
        isDisabled={(iso) => iso > today}
      />

      {selected && (
        <div className="cal-day">
          <div className="cal-day-title">{dayLabel} 재고{selected === today ? ' (오늘)' : ''}</div>
          {dayQ.isLoading ? (
            <Spinner center />
          ) : rows.length === 0 ? (
            <EmptyState icon="🗓️" title="이 날짜의 기록이 없어요" hint="분홍색으로 표시된 날짜를 선택하세요." />
          ) : (
            <>
              <div className="cal-day-summary">
                <span>🍨 아이스크림 <strong>{totals.ice}통</strong></span>
                {PRODUCT_CATEGORY_ORDER.map((c) => (
                  <span key={c}>
                    {PRODUCT_CATEGORY_LABELS[c]} <strong>{totals.byCat[c]}</strong>
                  </span>
                ))}
              </div>
              <details className="cal-day-detail">
                <summary>품목별 보기</summary>
                <div className="cal-day-list">
                  {rows
                    .filter((r) => r.itemType === 'storage' && r.quantity > 0)
                    .sort((a, b) => b.quantity - a.quantity)
                    .map((r) => (
                      <div className="cal-day-row" key={`s${r.itemId}`}>
                        <span>{flavorName.get(r.itemId) ?? '삭제된 맛'}</span>
                        <strong>{r.quantity}통</strong>
                      </div>
                    ))}
                  {rows
                    .filter((r) => r.itemType === 'product' && r.quantity > 0)
                    .map((r) => {
                      const p = productById.get(r.itemId)
                      if (!p) return null
                      return (
                        <div className="cal-day-row" key={`p${r.itemId}`}>
                          <span>{p.name}</span>
                          <strong>{r.quantity}{p.unit}</strong>
                        </div>
                      )
                    })}
                </div>
              </details>
              {selected !== today && (
                <button className="btn btn-danger btn-block cal-restore" onClick={onRestore} disabled={busy}>
                  {busy ? <span className="btn-spinner" aria-hidden="true" /> : <RotateCcw size={18} />}
                  이 날짜 재고로 되돌리기
                </button>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
