import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { useConfirm } from '@/components/ConfirmDialog'
import { useAddWorker, useDeleteWorker, useUpdateWorker } from '@/data/workers'
import { useLog } from '@/data/activity'
import { MIN_WAGE_2026, type Worker } from '@/lib/types'

const EMOJIS = ['👨', '👩', '👦', '👧', '🧑', '👴', '👵', '🧔', '👱']

interface Props {
  storeId: string | null
  worker?: Worker // present = edit mode
  onClose: () => void
  onDeleted?: () => void
}

export function WorkerModal({ storeId, worker, onClose, onDeleted }: Props) {
  const isEdit = !!worker
  const toast = useToast()
  const confirm = useConfirm()
  const addWorker = useAddWorker(storeId)
  const updateWorker = useUpdateWorker(storeId)
  const deleteWorker = useDeleteWorker(storeId)
  const log = useLog(storeId)

  const [emoji, setEmoji] = useState(worker?.emoji ?? '👤')
  const [name, setName] = useState(worker?.name ?? '')
  const [wage, setWage] = useState(worker?.wage ?? MIN_WAGE_2026)
  const [tax, setTax] = useState(worker?.taxWithholding ?? true)
  const [error, setError] = useState('')
  const busy = addWorker.isPending || updateWorker.isPending || deleteWorker.isPending

  const submit = async () => {
    if (!name.trim()) return setError('이름을 입력하세요')
    setError('')
    try {
      if (isEdit) {
        await updateWorker.mutateAsync({ id: worker!.id, name: name.trim(), emoji, wage, taxWithholding: tax })
        log(`직원 정보 수정: ${name.trim()}`, '근무')
        toast.success('직원 정보를 저장했습니다')
      } else {
        await addWorker.mutateAsync({ name: name.trim(), emoji, wage, taxWithholding: tax })
        log(`직원 추가: ${name.trim()}`, '근무')
        toast.success(`${name.trim()} 직원을 추가했습니다`)
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패')
    }
  }

  const remove = async () => {
    if (!worker) return
    const ok = await confirm({
      title: `${worker.name} 삭제`,
      message: '이 직원과 모든 근무 기록이 삭제됩니다. 계속할까요?',
      danger: true,
      confirmText: '삭제',
    })
    if (!ok) return
    try {
      await deleteWorker.mutateAsync(worker.id)
      log(`직원 삭제: ${worker.name}`, '근무')
      toast.success('삭제되었습니다')
      onClose()
      onDeleted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  return (
    <Modal
      title={isEdit ? '직원 정보' : '직원 추가'}
      onClose={onClose}
      actions={
        <>
          <button className="btn" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {isEdit ? '저장' : '추가'}
          </button>
        </>
      }
    >
      <div className="field">
        <label>아이콘</label>
        <div className="chip-tabs">
          {EMOJIS.map((e) => (
            <button
              key={e}
              className={`chip-tab ${emoji === e ? 'active' : ''}`}
              style={{ fontSize: 24, minWidth: 52 }}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>이름</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
      </div>
      <div className="field">
        <label>시급 (원)</label>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          value={wage}
          onChange={(e) => setWage(Number(e.target.value) || 0)}
        />
      </div>
      <div className="field">
        <label>세금 3.3% (사업소득세) 적용</label>
        <div className="seg">
          <button className={tax ? 'active' : ''} onClick={() => setTax(true)}>
            적용
          </button>
          <button className={!tax ? 'active' : ''} onClick={() => setTax(false)}>
            미적용
          </button>
        </div>
      </div>
      <div className="form-error">{error}</div>
      {isEdit && (
        <button className="btn btn-danger btn-block" onClick={remove} disabled={busy}>
          🗑️ 직원 삭제
        </button>
      )}
    </Modal>
  )
}
