import { useState } from 'react'
import { Printer, Pencil } from 'lucide-react'
import { useToast } from '@shared/components/Toast'
import { usePrompt } from '@shared/components/PromptModal'
import { useApp } from '@shared/app/AppProvider'
import { useUpdateWorker } from '@/data/workers'
import { useSetPayrollExtra, type Extra } from '@/data/payrollExtras'
import { useLog } from '@shared/data/activity'
import { computePayroll } from '@/lib/payroll'
import { won } from '@/lib/money'
import { formatHours } from '@/lib/time'
import { ymLabel } from '@shared/lib/date'
import type { Shift, Worker } from '@/lib/types'
import { PayslipPrint } from './PayslipPrint'

interface Props {
  workers: Worker[]
  shifts: Shift[]
  extras: Map<number, Extra>
  storeId: string | null
  ym: string
}

export function PayslipView({ workers, shifts, extras, storeId, ym }: Props) {
  const toast = useToast()
  const prompt = usePrompt()
  const { storeName } = useApp()
  const updateWorker = useUpdateWorker(storeId)
  const setExtra = useSetPayrollExtra(storeId, ym)
  const log = useLog(storeId)
  const [printing, setPrinting] = useState(false)

  if (workers.length === 0) {
    return <div className="empty-note">직원이 없습니다. 근무표 탭에서 직원을 추가하세요.</div>
  }

  const editWage = async (w: Worker) => {
    const v = await prompt({ title: `${w.name} 시급`, label: '시급 (원)', type: 'number', initialValue: String(w.wage), confirmText: '저장' })
    if (v === null) return
    const wage = Number(v)
    if (!Number.isFinite(wage) || wage <= 0) return toast.error('올바른 시급을 입력하세요')
    try {
      await updateWorker.mutateAsync({ id: w.id, wage })
      log(`${w.name} 시급 변경: ${won(wage)}`, '급여')
      toast.success('시급을 변경했습니다')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '변경 실패')
    }
  }

  const editExtra = async (w: Worker, current: number) => {
    const v = await prompt({ title: `${w.name} 초과/기타`, label: '추가 지급액 (원)', type: 'number', initialValue: String(current), confirmText: '저장' })
    if (v === null) return
    const amount = Number(v)
    if (!Number.isFinite(amount)) return toast.error('숫자를 입력하세요')
    try {
      await setExtra.mutateAsync({ workerId: w.id, amount, note: extras.get(w.id)?.note ?? '' })
      log(`${w.name} ${ymLabel(ym)} 초과/기타: ${won(amount)}`, '급여')
      toast.success('저장되었습니다')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패')
    }
  }

  const toggleTax = async (w: Worker) => {
    try {
      await updateWorker.mutateAsync({ id: w.id, taxWithholding: !w.taxWithholding })
      log(`${w.name} 3.3% 세금 ${w.taxWithholding ? '미적용' : '적용'}`, '급여')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '변경 실패')
    }
  }

  let grandNet = 0

  return (
    <div>
      <button className="btn btn-secondary btn-block btn-lg" style={{ marginBottom: 12 }} onClick={() => setPrinting(true)}>
        <Printer size={22} /> 명세서 인쇄 / PDF 저장
      </button>
      {workers.map((w) => {
        const extra = extras.get(w.id)?.amount ?? 0
        const p = computePayroll(shifts.filter((s) => s.workerId === w.id), w.wage, w.taxWithholding, extra)
        grandNet += p.net
        return (
          <div className="payslip-card" key={w.id}>
            <div className="payslip-head">
              <span style={{ fontSize: 28 }}>{w.emoji}</span>
              <span className="payslip-name">{w.name}</span>
              <span className="wage-toggle">
                <button className="toggle-pill" onClick={() => editWage(w)}>
                  {won(w.wage)}
                </button>
                <button className={`toggle-pill ${w.taxWithholding ? 'on' : 'off'}`} onClick={() => toggleTax(w)}>
                  3.3% {w.taxWithholding ? 'O' : 'X'}
                </button>
              </span>
            </div>

            <div className="payslip-line">
              <span className="lbl">총 근무시간</span>
              <span className="val">{formatHours(p.totalHours)}</span>
            </div>
            <div className="payslip-line">
              <span className="lbl">주휴시간</span>
              <span className="val">{formatHours(p.holidayHours)}</span>
            </div>
            <div className="payslip-line">
              <span className="lbl">기본급</span>
              <span className="val">{won(p.basePay)}</span>
            </div>
            <div className="payslip-line">
              <span className="lbl">주휴수당</span>
              <span className="val">{won(p.holidayPay)}</span>
            </div>
            <button className="payslip-line editable" onClick={() => editExtra(w, extra)}>
              <span className="lbl">초과/기타 <Pencil size={14} /></span>
              <span className="val">{won(extra)}</span>
            </button>
            <div className="payslip-line">
              <span className="lbl">세전급여</span>
              <span className="val">{won(p.gross)}</span>
            </div>
            <div className="payslip-line">
              <span className="lbl">공제액 (3.3%)</span>
              <span className="val">{p.deduction ? `−${won(p.deduction)}` : won(0)}</span>
            </div>
            <div className="payslip-line total">
              <span className="lbl">실수령액</span>
              <span className="val">{won(p.net)}</span>
            </div>
          </div>
        )
      })}

      {workers.length > 1 && (
        <div className="grand-total">
          <span>전체 실수령 합계</span>
          <span>{won(grandNet)}</span>
        </div>
      )}

      {printing && (
        <PayslipPrint storeName={storeName} ym={ym} workers={workers} shifts={shifts} extras={extras} onClose={() => setPrinting(false)} />
      )}
    </div>
  )
}
