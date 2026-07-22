import { useState } from 'react'
import { Modal } from '@shared/components/Modal'
import { useToast } from '@shared/components/Toast'
import { useAddFlavor } from '@/data/flavors'
import { useSetStorage } from '@/data/storage'
import { useLog } from '@shared/data/activity'
import { FLAVOR_TYPE_LABELS, FLAVOR_TYPE_ORDER, type FlavorType } from '@/lib/types'

export function AddFlavorModal({ storeId, onClose }: { storeId: string | null; onClose: () => void }) {
  const toast = useToast()
  const addFlavor = useAddFlavor(storeId)
  const setStorage = useSetStorage(storeId)
  const log = useLog(storeId)
  const [name, setName] = useState('')
  const [type, setType] = useState<FlavorType>('fixed')
  const [color, setColor] = useState('#ff69b4')
  const [qty, setQty] = useState(0)
  const [lotNumber, setLotNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [storageLocation, setStorageLocation] = useState('아이스크림 냉동고')
  const [error, setError] = useState('')
  const busy = addFlavor.isPending || setStorage.isPending

  const submit = async () => {
    if (!name.trim()) return setError('맛 이름을 입력하세요')
    setError('')
    try {
      const id = await addFlavor.mutateAsync({
        name: name.trim(),
        color,
        type,
        lotNumber,
        expiryDate: expiryDate || null,
        storageLocation,
      })
      if (qty > 0) await setStorage.mutateAsync({ flavorId: id, quantity: qty })
      log(`새 맛 추가: ${name.trim()}${qty > 0 ? ` (창고 ${qty}통)` : ''}`, '재고')
      toast.success(`${name.trim()} 추가됨`)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가 실패')
    }
  }

  return (
    <Modal
      title="🍨 새 맛 추가"
      onClose={onClose}
      actions={
        <>
          <button className="btn" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            추가
          </button>
        </>
      }
    >
      <div className="field">
        <label>맛 이름</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 슈팅스타" />
      </div>
      <div className="field">
        <label>종류</label>
        <div className="type-tabs">
          {FLAVOR_TYPE_ORDER.map((t) => (
            <button key={t} className={`type-tab ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
              {FLAVOR_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>색상</label>
        <input
          className="input"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ height: 52, padding: 4 }}
        />
      </div>
      <div className="field">
        <label>창고 수량 (통)</label>
        <div className="qty-control">
          <button className="qty-btn minus" onClick={() => setQty((q) => Math.max(0, q - 1))}>
            −
          </button>
          <span className="qty-display">{qty}</span>
          <button className="qty-btn plus" onClick={() => setQty((q) => q + 1)}>
            +
          </button>
        </div>
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
      <div className="form-error">{error}</div>
    </Modal>
  )
}
