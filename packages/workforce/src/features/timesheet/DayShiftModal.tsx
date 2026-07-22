import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { Modal } from '@shared/components/Modal'
import { useToast } from '@shared/components/Toast'
import { useConfirm } from '@shared/components/ConfirmDialog'
import { useAddShift, useDeleteShift } from '@/data/shifts'
import { useLog } from '@shared/data/activity'
import { WEEKDAYS_KO, parseDate } from '@/lib/date'
import { hoursBetween, minutesToLabel, formatHours, timeMarks } from '@/lib/time'
import type { Shift } from '@/lib/types'

interface Props {
  workerId: number
  workerName: string
  dateIso: string
  shifts: Shift[]
  storeId: string | null
  ym: string
  onClose: () => void
}

const MARKS = timeMarks()
// Quick shift presets (start/end minutes from midnight).
const PRESETS: { label: string; start: number; end: number }[] = [
  { label: '오픈 09–15', start: 540, end: 900 },
  { label: '미들 12–18', start: 720, end: 1080 },
  { label: '마감 15–22', start: 900, end: 1320 },
  { label: '종일 09–22', start: 540, end: 1320 },
]

export function DayShiftModal({ workerId, workerName, dateIso, shifts, storeId, ym, onClose }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const addShift = useAddShift(storeId, ym)
  const deleteShift = useDeleteShift(storeId, ym)
  const log = useLog(storeId)
  const [start, setStart] = useState(540)
  const [end, setEnd] = useState(900)

  const d = parseDate(dateIso)
  const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS_KO[d.getDay()]})`

  const addWith = async (s: number, e: number) => {
    if (e <= s) return toast.error('퇴근 시간이 출근 시간보다 빨라요')
    try {
      await addShift.mutateAsync({ workerId, workDate: dateIso, startMin: s, endMin: e })
      log(`${workerName} ${dateLabel} 근무 추가 ${minutesToLabel(s)}–${minutesToLabel(e)}`, '근무')
      toast.success('근무를 추가했습니다')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '추가 실패')
    }
  }

  const remove = async (s: Shift) => {
    const ok = await confirm({
      title: '근무 삭제',
      message: `${minutesToLabel(s.startMin)}–${minutesToLabel(s.endMin)} 근무를 삭제할까요?`,
      danger: true,
      confirmText: '삭제',
    })
    if (!ok) return
    try {
      await deleteShift.mutateAsync(s.id)
      log(`${workerName} ${dateLabel} 근무 삭제 ${minutesToLabel(s.startMin)}–${minutesToLabel(s.endMin)}`, '근무')
      toast.success('삭제되었습니다')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    }
  }

  return (
    <Modal
      title={dateLabel}
      subtitle={`${workerName}`}
      onClose={onClose}
      actions={
        <button className="btn btn-block" onClick={onClose}>
          닫기
        </button>
      }
    >
      {shifts.length === 0 && <div className="empty-note">등록된 근무가 없습니다</div>}
      {shifts.map((s) => (
        <div className="shift-row" key={s.id}>
          <span className="grow">
            {minutesToLabel(s.startMin)} – {minutesToLabel(s.endMin)}
          </span>
          <span style={{ color: 'var(--text-2)' }}>{formatHours(hoursBetween(s.startMin, s.endMin))}</span>
          <button className="icon-btn-sm" onClick={() => remove(s)} aria-label="삭제">
            <Trash2 size={20} />
          </button>
        </div>
      ))}

      <div className="preset-label">빠른 추가</div>
      <div className="preset-grid">
        {PRESETS.map((p) => (
          <button key={p.label} className="preset-btn" onClick={() => addWith(p.start, p.end)} disabled={addShift.isPending}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="preset-label">직접 입력</div>
      <div className="time-pickers">
        <select value={start} onChange={(e) => setStart(Number(e.target.value))} aria-label="출근 시간">
          {MARKS.map((m) => (
            <option key={m} value={m}>
              {minutesToLabel(m)}
            </option>
          ))}
        </select>
        <span>–</span>
        <select value={end} onChange={(e) => setEnd(Number(e.target.value))} aria-label="퇴근 시간">
          {MARKS.map((m) => (
            <option key={m} value={m}>
              {minutesToLabel(m)}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary btn-block" onClick={() => addWith(start, end)} disabled={addShift.isPending}>
        <Plus size={20} /> 근무 추가 ({formatHours(Math.max(0, hoursBetween(start, end)))})
      </button>
    </Modal>
  )
}
