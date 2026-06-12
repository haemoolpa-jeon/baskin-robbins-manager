import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/ConfirmDialog'
import { useSetStorage } from '@/data/storage'
import { useDeleteFlavor, useUpdateFlavor } from '@/data/flavors'
import { useLog } from '@/data/activity'
import { FLAVOR_TYPE_LABELS, type Flavor } from '@/lib/types'

interface Props {
  flavor: Flavor
  currentQty: number
  storeId: string | null
  onClose: () => void
}

export function StorageItemModal({ flavor, currentQty, storeId, onClose }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const log = useLog(storeId)
  const setStorage = useSetStorage(storeId)
  const updateFlavor = useUpdateFlavor(storeId)
  const deleteFlavor = useDeleteFlavor(storeId)
  const [qty, setQty] = useState(currentQty)
  const busy = setStorage.isPending || updateFlavor.isPending || deleteFlavor.isPending

  const save = async () => {
    try {
      await setStorage.mutateAsync({ flavorId: flavor.id, quantity: qty })
      if (qty !== currentQty) log(`창고 재고 변경: ${flavor.name} ${currentQty}→${qty}통`, '재고')
      toast.success('저장되었습니다')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패')
    }
  }

  const toggleAvailable = async () => {
    try {
      await updateFlavor.mutateAsync({ id: flavor.id, available: !flavor.available })
      log(`${flavor.name} ${flavor.available ? '판매중지' : '판매중'}으로 변경`, '재고')
      toast.success(flavor.available ? '판매중지로 변경' : '판매중으로 변경')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '변경 실패')
    }
  }

  const remove = async () => {
    const ok = await confirm({ title: `${flavor.name} 삭제`, message: '이 맛을 삭제하시겠습니까?', danger: true, confirmText: '삭제' })
    if (!ok) return
    try {
      await deleteFlavor.mutateAsync(flavor.id)
      log(`맛 삭제: ${flavor.name}`, '재고')
      toast.success('삭제되었습니다')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  return (
    <Modal
      title={`🍨 ${flavor.name}`}
      subtitle={`${FLAVOR_TYPE_LABELS[flavor.type]}${flavor.available ? '' : ' · 🚫 판매중지'}`}
      onClose={onClose}
      actions={
        <>
          <button className="btn" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            저장
          </button>
        </>
      }
    >
      <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-2)' }}>📦 창고 재고</div>
      <div className="qty-control">
        <button className="qty-btn minus" onClick={() => setQty((q) => Math.max(0, q - 1))}>
          −
        </button>
        <span className="qty-display">{qty}</span>
        <button className="qty-btn plus" onClick={() => setQty((q) => q + 1)}>
          +
        </button>
      </div>
      <div className="slot-action-row">
        <button className="btn btn-secondary" onClick={toggleAvailable} disabled={busy}>
          {flavor.available ? '🚫 판매중지로 변경' : '✅ 판매중으로 변경'}
        </button>
      </div>
      <div className="slot-action-row">
        <button className="btn btn-danger" onClick={remove} disabled={busy}>
          🗑️ 이 맛 삭제
        </button>
      </div>
    </Modal>
  )
}
