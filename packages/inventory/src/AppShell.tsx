import { useState } from 'react'
import { Boxes, ShoppingCart, Settings, History } from 'lucide-react'
import { useApp } from '@shared/app/AppProvider'
import { Spinner } from '@shared/components/Spinner'
import { ErrorState } from '@shared/components/ErrorState'
import { SettingsModal } from '@shared/settings/SettingsModal'
import { HistoryModal } from '@shared/settings/HistoryModal'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { SalesPage } from '@/features/sales/SalesPage'

type Tab = 'inventory' | 'sales'

const TABS: { key: Tab; label: string; Icon: typeof Boxes }[] = [
  { key: 'inventory', label: '재고 관리', Icon: Boxes },
  { key: 'sales', label: '주문 준비', Icon: ShoppingCart },
]

export function AppShell() {
  const { storeName, isLoading, isError } = useApp()
  const [tab, setTab] = useState<Tab>('inventory')
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
          <span style={{ fontSize: 22 }}>📦</span>
          <span className="brand-copy">
            <strong>재고 매니저</strong>
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
        {tab === 'inventory' && <InventoryPage />}
        {tab === 'sales' && <SalesPage />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`nav-btn ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={30} strokeWidth={tab === key ? 2.5 : 2} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {overlay === 'settings' && <SettingsModal onClose={() => setOverlay(null)} />}
      {overlay === 'history' && <HistoryModal onClose={() => setOverlay(null)} />}
    </div>
  )
}
