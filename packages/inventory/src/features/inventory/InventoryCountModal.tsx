import { useMemo, useState } from 'react'
import { Modal } from '@shared/components/Modal'
import { useConfirm } from '@shared/components/ConfirmDialog'
import { useToast } from '@shared/components/Toast'
import { SearchInput } from '@shared/components/SearchInput'
import { ChipTabs } from '@shared/components/ChipTabs'
import { Stepper } from '@shared/components/Stepper'
import { useLog } from '@shared/data/activity'
import { useSetStorageBatch } from '@/data/storage'
import { stockStatus } from '@/lib/stock'
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
      .filter((flavor) => filter !== 'low' || (draft[flavor.id] ?? 0) < (flavor.par ?? targetPar))
      .filter((flavor) => filter !== 'changed' || changed.has(flavor.id))
      .sort((a, b) => {
        const qtyDiff = (draft[a.id] ?? 0) - (draft[b.id] ?? 0)
        return qtyDiff || a.name.localeCompare(b.name, 'ko')
      })
  }, [changed, draft, filter, flavors, query, targetPar])

  const setQty = (flavorId: number, value: number) =>
    setDraft((current) => ({ ...current, [flavorId]: value }))

  const clearAll = async () => {
    const ok = await confirm({
      title: '전체 0으로',
      message: '판매중인 모든 맛의 수량을 0으로 바꿀까요? 저장 전에는 되돌릴 수 있어요.',
      danger: true,
      confirmText: '0으로',
    })
    if (!ok) return
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(flavors.filter((flavor) => flavor.available).map((flavor) => [flavor.id, 0])),
    }))
  }

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
            {saveBatch.isPending && <span className="btn-spinner" aria-hidden="true" />}
            {changedIds.length > 0 ? `${changedIds.length}개 변경 저장` : '변경 없음'}
          </button>
        </>
      }
    >
      <SearchInput ariaLabel="맛 검색" placeholder="맛 이름 검색" value={query} onChange={setQuery} />
      <div className="count-toolbar">
        <ChipTabs
          ariaLabel="실사 목록 필터"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: '전체' },
            { value: 'low', label: '부족' },
            { value: 'changed', label: '변경', count: changedIds.length },
          ]}
        />
        <button className="count-clear-all" onClick={clearAll}>
          전체 0으로
        </button>
      </div>
      <p className="count-clear-hint">저장을 누르기 전에는 실제 재고에 반영되지 않습니다.</p>
      <div className="count-list">
        {visible.length === 0 && <div className="no-result">표시할 맛이 없습니다</div>}
        {visible.map((flavor) => {
          const qty = draft[flavor.id] ?? 0
          const par = flavor.par ?? targetPar
          const status = stockStatus(qty, par)
          return (
            <div className={`count-row ${changed.has(flavor.id) ? 'changed' : ''}`} key={flavor.id}>
              <span className="count-color" style={{ background: flavor.color }} />
              <div className="count-name">
                <strong>{flavor.name}</strong>
                <span>
                  {status === 'empty'
                    ? '품절'
                    : status === 'low'
                      ? `목표보다 ${par - qty}통 부족`
                      : '재고 충분'}
                </span>
              </div>
              <Stepper
                size="sm"
                ariaLabel={`${flavor.name} 수량`}
                value={qty}
                onChange={(next) => setQty(flavor.id, next)}
              />
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
