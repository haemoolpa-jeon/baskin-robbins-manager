import { useState } from 'react'
import { Modal } from '@shared/components/Modal'
import { useToast } from '@shared/components/Toast'
import { useConfirm } from '@shared/components/ConfirmDialog'
import { Stepper } from '@shared/components/Stepper'
import { useSetStorage } from '@/data/storage'
import { useDeleteFlavor, useUpdateFlavor } from '@/data/flavors'
import { useLog } from '@shared/data/activity'
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
  const [lotNumber, setLotNumber] = useState(flavor.lotNumber)
  const [expiryDate, setExpiryDate] = useState(flavor.expiryDate ?? '')
  const [storageLocation, setStorageLocation] = useState(flavor.storageLocation)
  const busy = setStorage.isPending || updateFlavor.isPending || deleteFlavor.isPending

  const save = async () => {
    try {
      await setStorage.mutateAsync({ flavorId: flavor.id, quantity: qty })
      await updateFlavor.mutateAsync({
        id: flavor.id,
        lotNumber,
        expiryDate: expiryDate || null,
        storageLocation,
      })
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
            {busy && <span className="btn-spinner" aria-hidden="true" />}
            저장
          </button>
        </>
      }
    >
      <div className="field">
        <label>📦 창고 재고 (통)</label>
        <Stepper size="lg" ariaLabel="창고 재고 수량" value={qty} onChange={setQty} />
      </div>
      <div className="form-grid-two">
        <div className="field">
          <label>가장 가까운 LOT <small>(선택)</small></label>
          <input className="input" value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} placeholder="텁의 LOT 번호" />
        </div>
        <div className="field">
          <label>소비기한 <small>(선택)</small></label>
          <input className="input" type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>보관 위치</label>
        <input className="input" value={storageLocation} onChange={(event) => setStorageLocation(event.target.value)} placeholder="예: 냉동고 A칸" />
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
