import { useMemo, useState } from 'react'
import { CalendarDays, Wallet, UserPlus, Pencil } from 'lucide-react'
import { useApp } from '@shared/app/AppProvider'
import { Spinner } from '@shared/components/Spinner'
import { useWorkers } from '@/data/workers'
import { useShifts } from '@/data/shifts'
import { usePayrollExtras } from '@/data/payrollExtras'
import { computePayroll } from '@/lib/payroll'
import { formatHours } from '@/lib/time'
import { parseDate } from '@shared/lib/date'
import type { Shift, Worker } from '@/lib/types'
import { MonthPicker } from '@shared/components/MonthPicker'
import { ScheduleCalendar } from './ScheduleCalendar'
import { DayShiftModal } from './DayShiftModal'
import { PayslipView } from './PayslipView'
import { WorkerModal } from './WorkerModal'
import '@/styles/timesheet.css'

type View = 'schedule' | 'payslip'
type WorkerModalState = { mode: 'add' } | { mode: 'edit'; worker: Worker } | null

export function TimesheetPage() {
  const { storeId, yearMonth, setYearMonth } = useApp()

  const workersQ = useWorkers(storeId)
  const shiftsQ = useShifts(storeId, yearMonth)
  const extrasQ = usePayrollExtras(storeId, yearMonth)

  const [view, setView] = useState<View>('schedule')
  const [activeWorkerId, setActiveWorkerId] = useState<number | null>(null)
  const [dayModal, setDayModal] = useState<string | null>(null)
  const [workerModal, setWorkerModal] = useState<WorkerModalState>(null)

  const workers = workersQ.data ?? []
  const shifts = shiftsQ.data ?? []
  const extras = extrasQ.data ?? new Map()

  const activeWorker = workers.find((w) => w.id === activeWorkerId) ?? workers[0] ?? null

  const workerShifts = useMemo(
    () => (activeWorker ? shifts.filter((s) => s.workerId === activeWorker.id) : []),
    [shifts, activeWorker],
  )
  const shiftsByDate = useMemo(() => {
    const m = new Map<string, Shift[]>()
    for (const s of workerShifts) {
      const arr = m.get(s.workDate) ?? []
      arr.push(s)
      m.set(s.workDate, arr)
    }
    return m
  }, [workerShifts])

  const weeklySummary = useMemo(
    () => (activeWorker ? computePayroll(workerShifts, activeWorker.wage, activeWorker.taxWithholding, 0) : null),
    [workerShifts, activeWorker],
  )

  if (workersQ.isLoading || shiftsQ.isLoading || extrasQ.isLoading) {
    return (
      <div className="page">
        <Spinner center />
      </div>
    )
  }
  if (workersQ.isError || shiftsQ.isError || extrasQ.isError) {
    return (
      <div className="page">
        <h1 className="page-title">근무 관리</h1>
        <div className="card" style={{ textAlign: 'center', color: 'var(--danger)' }}>
          데이터를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">근무 관리</h1>

      <MonthPicker ym={yearMonth} onChange={setYearMonth} />

      <div className="view-toggle">
        <button className={view === 'schedule' ? 'active' : ''} onClick={() => setView('schedule')}>
          <CalendarDays size={20} /> 근무표
        </button>
        <button className={view === 'payslip' ? 'active' : ''} onClick={() => setView('payslip')}>
          <Wallet size={20} /> 급여 명세서
        </button>
      </div>

      {view === 'schedule' ? (
        workers.length === 0 ? (
          <div className="empty-note">
            아직 직원이 없습니다.
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary btn-lg" onClick={() => setWorkerModal({ mode: 'add' })}>
                <UserPlus size={22} /> 직원 추가
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="worker-chips">
              {workers.map((w) => (
                <button
                  key={w.id}
                  className={`worker-chip ${activeWorker?.id === w.id ? 'active' : ''}`}
                  onClick={() => setActiveWorkerId(w.id)}
                >
                  {w.emoji} {w.name}
                </button>
              ))}
              <button className="worker-chip add" onClick={() => setWorkerModal({ mode: 'add' })}>
                <UserPlus size={18} /> 직원
              </button>
            </div>

            {activeWorker && (
              <>
                <div style={{ marginBottom: 12, textAlign: 'right' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ minHeight: 44, padding: '0 14px' }}
                    onClick={() => setWorkerModal({ mode: 'edit', worker: activeWorker })}
                  >
                    <Pencil size={18} /> {activeWorker.name} 정보 수정
                  </button>
                </div>

                <ScheduleCalendar ym={yearMonth} shiftsByDate={shiftsByDate} onDayTap={(iso) => setDayModal(iso)} />

                {weeklySummary && (
                  <div className="week-summary">
                    {weeklySummary.weeks.map((wk, i) => (
                      <div className="week-summary-row" key={wk.weekStart}>
                        <span className="grow">
                          {i + 1}주차 ({parseDate(wk.weekStart).getMonth() + 1}/{parseDate(wk.weekStart).getDate()}~)
                        </span>
                        <span>{formatHours(wk.hours)}</span>
                        {wk.holidayHours > 0 && <span className="holiday-badge">주휴 +{formatHours(wk.holidayHours)}</span>}
                      </div>
                    ))}
                    <div className="week-summary-row total">
                      <span className="grow">이번 달 합계</span>
                      <span className="total-hours">{formatHours(weeklySummary.totalHours)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )
      ) : (
        <PayslipView workers={workers} shifts={shifts} extras={extras} storeId={storeId} ym={yearMonth} />
      )}

      {dayModal && activeWorker && (
        <DayShiftModal
          workerId={activeWorker.id}
          workerName={activeWorker.name}
          dateIso={dayModal}
          shifts={shiftsByDate.get(dayModal) ?? []}
          storeId={storeId}
          ym={yearMonth}
          onClose={() => setDayModal(null)}
        />
      )}

      {workerModal && (
        <WorkerModal
          storeId={storeId}
          worker={workerModal.mode === 'edit' ? workerModal.worker : undefined}
          onClose={() => setWorkerModal(null)}
          onDeleted={() => setActiveWorkerId(null)}
        />
      )}
    </div>
  )
}
