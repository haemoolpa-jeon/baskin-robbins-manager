import { useMemo, useState } from 'react'
import { Modal } from '@shared/components/Modal'
import { useConfirm } from '@shared/components/ConfirmDialog'
import { useToast } from '@shared/components/Toast'
import { ChipTabs } from '@shared/components/ChipTabs'
import { Stepper } from '@shared/components/Stepper'
import { useLog } from '@shared/data/activity'
import { useSetProductQuantities } from '@/data/products'
import { PRODUCT_CATEGORY_LABELS, productSubtypeLabel, type InventoryProduct, type ProductCategory } from '@/lib/types'

interface Props {
  products: InventoryProduct[]
  category: ProductCategory
  storeId: string | null
  onClose: () => void
}

type CountFilter = 'all' | 'changed'

export function ProductCountModal({ products, category, storeId, onClose }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const log = useLog(storeId)
  const saveQuantities = useSetProductQuantities(storeId)
  const categoryProducts = products.filter((product) => product.category === category)
  const [draft, setDraft] = useState<Record<number, number>>(() =>
    Object.fromEntries(categoryProducts.map((product) => [product.id, product.quantity])),
  )
  const [filter, setFilter] = useState<CountFilter>('all')

  const changedIds = useMemo(
    () => categoryProducts.filter((product) => (draft[product.id] ?? 0) !== product.quantity).map((product) => product.id),
    [categoryProducts, draft],
  )
  const changed = useMemo(() => new Set(changedIds), [changedIds])
  const visible = categoryProducts
    .filter((product) => product.available && (filter !== 'changed' || changed.has(product.id)))
    .sort((a, b) => (draft[a.id] ?? 0) - (draft[b.id] ?? 0) || a.name.localeCompare(b.name, 'ko'))

  const setQty = (id: number, quantity: number) =>
    setDraft((current) => ({ ...current, [id]: quantity }))

  const clearAll = async () => {
    const ok = await confirm({
      title: '전체 0으로',
      message: '판매중인 모든 품목의 수량을 0으로 바꿀까요? 저장 전에는 되돌릴 수 있어요.',
      danger: true,
      confirmText: '0으로',
    })
    if (!ok) return
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(categoryProducts.filter((product) => product.available).map((product) => [product.id, 0])),
    }))
  }

  const requestClose = async () => {
    if (changedIds.length === 0) return onClose()
    const discard = await confirm({
      title: '실사를 끝낼까요?',
      message: `저장하지 않은 ${changedIds.length}개 변경이 있습니다.`,
      danger: true,
      confirmText: '변경 버리기',
    })
    if (discard) onClose()
  }

  const save = async () => {
    if (changedIds.length === 0) return onClose()
    try {
      await saveQuantities.mutateAsync(changedIds.map((id) => ({ id, quantity: draft[id] ?? 0 })))
      log(`${PRODUCT_CATEGORY_LABELS[category]} 빠른 실사: ${changedIds.length}개 상품 수정`, '재고')
      toast.success(`${changedIds.length}개 상품 재고를 저장했습니다`)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '실사 저장 실패')
    }
  }

  return (
    <Modal
      title={`${PRODUCT_CATEGORY_LABELS[category]} 빠른 실사`}
      subtitle={category === 'supply' ? '선반을 돌면서 팩·박스 수량을 맞추세요' : '냉동고를 보면서 수량을 맞추세요'}
      onClose={requestClose}
      actions={
        <>
          <button className="btn" onClick={requestClose}>취소</button>
          <button className="btn btn-primary" onClick={save} disabled={saveQuantities.isPending || changedIds.length === 0}>
            {saveQuantities.isPending && <span className="btn-spinner" aria-hidden="true" />}
            {changedIds.length ? `${changedIds.length}개 변경 저장` : '변경 없음'}
          </button>
        </>
      }
    >
      <div className="count-toolbar">
        <ChipTabs
          ariaLabel="실사 목록 필터"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: '전체' },
            { value: 'changed', label: '변경', count: changedIds.length },
          ]}
        />
        <button className="count-clear-all" onClick={clearAll}>전체 0으로</button>
      </div>
      <p className="count-clear-hint">저장을 누르기 전에는 실제 재고에 반영되지 않습니다.</p>
      <div className="count-list">
        {visible.length === 0 && <div className="no-result">변경된 상품이 없습니다</div>}
        {visible.map((product) => {
          const qty = draft[product.id] ?? 0
          return (
            <div className={`count-row ${changed.has(product.id) ? 'changed' : ''}`} key={product.id}>
              <div className="count-name">
                <strong>{product.name}</strong>
                <span>
                  {productSubtypeLabel(product.category, product.subtype)}
                  {product.sizeLabel ? ` · ${product.sizeLabel}` : ''} · 목표 {product.par}{product.unit}
                </span>
              </div>
              <Stepper
                size="sm"
                ariaLabel={`${product.name} 수량`}
                value={qty}
                onChange={(next) => setQty(product.id, next)}
              />
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
