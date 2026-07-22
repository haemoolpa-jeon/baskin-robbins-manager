import { useState } from 'react'
import { CalendarClock, Settings, History } from 'lucide-react'
import { useApp } from '@shared/app/AppProvider'
import { Spinner } from '@shared/components/Spinner'
import { ErrorState } from '@shared/components/ErrorState'
import { SettingsModal } from '@shared/settings/SettingsModal'
import { HistoryModal } from '@shared/settings/HistoryModal'
import { TimesheetPage } from '@/features/timesheet/TimesheetPage'

export function AppShell() {
  const { storeName, isLoading, isError } = useApp()
  const [overlay, setOverlay] = useState<'settings' | 'history' | null>(null)

  if (isLoading) return <Spinner center />
  if (isError) {
    return (
      <div className="page" style={{ paddingTop: 80 }}>
        <ErrorState title="매장 정보를 불러오지 못했어요" />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <span style={{ fontSize: 22 }}>🗓️</span>
          <span className="brand-copy">
            <strong>근무 매니저</strong>
            <small className="store-name">{storeName}</small>
          </span>
        </div>
        <button className="header-icon" onClick={() => setOverlay('history')} aria-label="변경 기록">
          <History size={24} />
        </button>
        <button className="header-icon" onClick={() => setOverlay('settings')} aria-label="설정">
          <Settings size={24} />
        </button>
      </header>

      <main>
        <TimesheetPage />
      </main>

      <nav className="bottom-nav">
        <button className="nav-btn active">
          <CalendarClock size={30} strokeWidth={2.5} />
          <span className="nav-label">근무·급여</span>
        </button>
      </nav>

      {overlay === 'settings' && <SettingsModal onClose={() => setOverlay(null)} />}
      {overlay === 'history' && <HistoryModal onClose={() => setOverlay(null)} />}
    </div>
  )
}
