import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Modal } from '@shared/components/Modal'
import { useConfirm } from '@shared/components/ConfirmDialog'
import { useToast } from '@shared/components/Toast'
import { useLog } from '@shared/data/activity'
import { useSetStorageBatch } from '@/data/storage'
import type { Flavor, Storage } from '@/lib/types'

interface Props {
  flavors: Flavor[]
  storage: Storage
  storeId: string | null
  targetPar: number
  onClose: () => void
}

type CountFilter = 'all' | 'low' | 'changed'

export function InventoryCountModal({ flavors, storage, storeId, targetPar, onClose }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const log = useLog(storeId)
  const saveBatch = useSetStorageBatch(storeId)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CountFilter>('all')
  const [draft, setDraft] = useState<Storage>(() => ({ ...storage }))

  const changedIds = useMemo(
    () =>
      flavors
        .filter((flavor) => (draft[flavor.id] ?? 0) !== (storage[flavor.id] ?? 0))
        .map((flavor) => flavor.id),
    [draft, flavors, storage],
  )
  const changed = useMemo(() => new Set(changedIds), [changedIds])

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return flavors
      .filter((flavor) => flavor.available)
      .filter((flavor) => !normalized || flavor.name.toLowerCase().includes(normalized))
      .filter((flavor) => filter !== 'low' || (draft[flavor.id] ?? 0) < targetPar)
      .filter((flavor) => filter !== 'changed' || changed.has(flavor.id))
      .sort((a, b) => {
        const qtyDiff = (draft[a.id] ?? 0) - (draft[b.id] ?? 0)
        return qtyDiff || a.name.localeCompare(b.name, 'ko')
      })
  }, [changed, draft, filter, flavors, query, targetPar])

  const setQty = (flavorId: number, value: number) =>
    setDraft((current) => ({ ...current, [flavorId]: Math.max(0, Math.floor(value || 0)) }))

  const clearAll = () =>
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(flavors.filter((flavor) => flavor.available).map((flavor) => [flavor.id, 0])),
    }))

  const requestClose = async () => {
    if (changedIds.length === 0) return onClose()
    const discard = await confirm({
      title: '실사를 끝낼까요?',
      message: `저장하지 않은 ${changedIds.length}개 변경이 있습니다. 변경을 버릴까요?`,
      danger: true,
      confirmText: '변경 버리기',
    })
    if (discard) onClose()
  }

  const save = async () => {
    if (changedIds.length === 0) return onClose()
    try {
      await saveBatch.mutateAsync(
        changedIds.map((flavorId) => ({ flavorId, quantity: draft[flavorId] ?? 0 })),
      )
      log(`창고 빠른 실사 완료: ${changedIds.length}개 맛 재고 수정`, '재고')
      toast.success(`${changedIds.length}개 재고를 한 번에 저장했습니다`)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '실사 저장 실패')
    }
  }

  return (
    <Modal
      title="창고 빠른 실사"
      subtitle="창고를 보면서 수량만 차례로 맞추세요"
      onClose={requestClose}
      actions={
        <>
          <button className="btn" onClick={requestClose}>
            취소
          </button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={saveBatch.isPending || changedIds.length === 0}
          >
            {changedIds.length > 0 ? `${changedIds.length}개 변경 저장` : '변경 없음'}
          </button>
        </>
      }
    >
      <label className="count-search">
        <Search size={20} aria-hidden="true" />
        <input
          aria-label="맛 검색"
          placeholder="맛 이름 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="count-filters" aria-label="실사 목록 필터">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          전체
        </button>
        <button className={filter === 'low' ? 'active' : ''} onClick={() => setFilter('low')}>
          부족
        </button>
        <button className={filter === 'changed' ? 'active' : ''} onClick={() => setFilter('changed')}>
          변경 {changedIds.length}
        </button>
        <button className="count-clear-all" onClick={clearAll}>
          전체 0으로
        </button>
      </div>
      <p className="count-clear-hint">저장을 누르기 전에는 실제 재고에 반영되지 않습니다.</p>
      <div className="count-list">
        {visible.length === 0 && <div className="no-result">표시할 맛이 없습니다</div>}
        {visible.map((flavor) => {
          const qty = draft[flavor.id] ?? 0
          const isChanged = changed.has(flavor.id)
          return (
            <div className={`count-row ${isChanged ? 'changed' : ''}`} key={flavor.id}>
              <span className="count-color" style={{ background: flavor.color }} />
              <div className="count-name">
                <strong>{flavor.name}</strong>
                <span>
                  {qty === 0
                    ? '품절'
                    : qty < targetPar
                      ? `목표보다 ${targetPar - qty}통 부족`
                      : '재고 충분'}
                </span>
              </div>
              <div className="count-stepper">
                <button
                  aria-label={`${flavor.name} 1통 빼기`}
                  onClick={() => setQty(flavor.id, qty - 1)}
                  disabled={qty === 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-label={`${flavor.name} 수량`}
                  value={qty}
                  onChange={(event) => setQty(flavor.id, Number(event.target.value))}
                />
                <button
                  aria-label={`${flavor.name} 1통 더하기`}
                  onClick={() => setQty(flavor.id, qty + 1)}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
