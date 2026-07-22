import { createPortal } from 'react-dom'
import { computePayroll } from '@/lib/payroll'
import { won } from '@/lib/money'
import { formatHours } from '@/lib/time'
import { ymLabel } from '@/lib/date'
import type { Extra } from '@/data/payrollExtras'
import type { Shift, Worker } from '@/lib/types'
import '@/styles/print.css'

interface Props {
  storeName: string
  ym: string
  workers: Worker[]
  shifts: Shift[]
  extras: Map<number, Extra>
  onClose: () => void
}

export function PayslipPrint({ storeName, ym, workers, shifts, extras, onClose }: Props) {
  const rows = workers.map((w) => {
    const extra = extras.get(w.id)?.amount ?? 0
    const p = computePayroll(
      shifts.filter((s) => s.workerId === w.id),
      w.wage,
      w.taxWithholding,
      extra,
    )
    return { w, p }
  })

  const totals = rows.reduce(
    (a, { p }) => ({ gross: a.gross + p.gross, deduction: a.deduction + p.deduction, net: a.net + p.net }),
    { gross: 0, deduction: 0, net: 0 },
  )

  return createPortal(
    <div className="print-overlay">
      <div className="print-toolbar no-print">
        <button className="btn" onClick={onClose}>
          닫기
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨️ 인쇄 / PDF 저장
        </button>
      </div>
      <div className="print-root">
        <div className="print-title">
          📅 {storeName} · {ymLabel(ym)} 급여 명세서
        </div>
        <table className="payslip-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>시급</th>
              <th>세금</th>
              <th>총시간</th>
              <th>주휴시간</th>
              <th>기본급</th>
              <th>주휴수당</th>
              <th>초과/기타</th>
              <th>세전급여</th>
              <th>공제(3.3%)</th>
              <th>실수령액</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ w, p }) => (
              <tr key={w.id}>
                <td className="name">
                  {w.emoji} {w.name}
                </td>
                <td>{won(w.wage)}</td>
                <td style={{ textAlign: 'center' }}>{w.taxWithholding ? 'O' : '–'}</td>
                <td>{formatHours(p.totalHours)}</td>
                <td>{formatHours(p.holidayHours)}</td>
                <td>{won(p.basePay)}</td>
                <td>{won(p.holidayPay)}</td>
                <td>{won(p.extra)}</td>
                <td>{won(p.gross)}</td>
                <td>{p.deduction ? `−${won(p.deduction)}` : '–'}</td>
                <td className="net">{won(p.net)}</td>
              </tr>
            ))}
            {rows.length > 1 && (
              <tr className="total-row">
                <td className="name">합계</td>
                <td colSpan={7}></td>
                <td>{won(totals.gross)}</td>
                <td>{totals.deduction ? `−${won(totals.deduction)}` : '–'}</td>
                <td className="net">{won(totals.net)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>,
    document.body,
  )
}
