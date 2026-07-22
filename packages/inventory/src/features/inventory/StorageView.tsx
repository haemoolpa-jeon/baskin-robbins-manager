import { useMemo, useState, type ReactNode } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { SearchInput } from '@shared/components/SearchInput'
import { ChipTabs } from '@shared/components/ChipTabs'
import { EmptyState } from '@shared/components/EmptyState'
import { stockStatus } from '@/lib/stock'
import { FLAVOR_TYPE_LABELS, FLAVOR_TYPE_ORDER, type Flavor, type Storage } from '@/lib/types'

interface Props {
  flavors: Flavor[]
  storage: Storage
  canEdit: boolean
  targetPar: number
  shortageOnly: boolean
  onShortageOnlyChange: (value: boolean) => void
  onItemTap: (flavorId: number) => void
  onCount: () => void
}

export function StorageView({
  flavors,
  storage,
  canEdit,
  targetPar,
  shortageOnly,
  onShortageOnlyChange,
  onItemTap,
  onCount,
}: Props) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = flavors.filter(
      (f) => (!q || f.name.toLowerCase().includes(q)) && (!shortageOnly || (f.available && (storage[f.id] ?? 0) < targetPar)),
    )
    return FLAVOR_TYPE_ORDER.map((t) => ({
      type: t,
      items: filtered.filter((f) => f.type === t),
    })).filter((g) => g.items.length > 0)
  }, [flavors, query, shortageOnly, storage, targetPar])

  return (
    <>
      <div className="storage-tools">
        <SearchInput ariaLabel="맛 검색" placeholder="맛 이름 검색" value={query} onChange={setQuery} />
        {canEdit && (
          <button className="count-mode-btn" onClick={onCount}>
            <ClipboardCheck size={22} />
            빠른 실사
          </button>
        )}
      </div>
      <ChipTabs
        ariaLabel="재고 필터"
        value={shortageOnly ? 'low' : 'all'}
        onChange={(v) => onShortageOnlyChange(v === 'low')}
        options={[
          { value: 'all', label: '전체' },
          { value: 'low', label: '부족 재고만', tone: 'shortage' },
        ]}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon="🍨"
          title={shortageOnly ? '부족한 맛이 없습니다' : '표시할 맛이 없습니다'}
          hint={shortageOnly ? '모든 맛의 창고 재고가 목표 이상입니다.' : '검색어를 지우거나 새 맛을 추가해 보세요.'}
        />
      ) : (
        <div className="storage-grid">
          {groups.map((g) => (
            <FragmentSection key={g.type} label={FLAVOR_TYPE_LABELS[g.type]}>
              {g.items.map((f) => {
                const qty = storage[f.id] ?? 0
                const status = stockStatus(qty, targetPar)
                return (
                  <button
                    key={f.id}
                    className={`storage-item ${f.available ? '' : 'unavailable'}`}
                    onClick={() => onItemTap(f.id)}
                  >
                    <span className="storage-tub" style={{ ['--tub' as string]: f.color }}>🍨</span>
                    <div className="storage-name">{f.name}</div>
                    <div className={`storage-count ${status === 'ok' ? '' : status}`}>{qty}통</div>
                    {!f.available && <div className="storage-badge">판매중지</div>}
                  </button>
                )
              })}
            </FragmentSection>
          ))}
        </div>
      )}
    </>
  )
}

// Section header spanning the grid, followed by its items (both are grid children).
function FragmentSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div className="storage-section">{label}</div>
      {children}
    </>
  )
}
