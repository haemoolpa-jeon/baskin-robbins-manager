import { useMemo, useState } from 'react'
import { ClipboardCheck, Search } from 'lucide-react'
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
        <label className="storage-search">
          <Search size={20} aria-hidden="true" />
          <input placeholder="맛 이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="맛 검색" />
        </label>
        {canEdit && (
          <button className="count-mode-btn" onClick={onCount}>
            <ClipboardCheck size={22} />
            빠른 실사
          </button>
        )}
      </div>
      <div className="storage-filter-row">
        <button className={!shortageOnly ? 'active' : ''} onClick={() => onShortageOnlyChange(false)}>전체</button>
        <button className={shortageOnly ? 'active shortage' : ''} onClick={() => onShortageOnlyChange(true)}>
          부족 재고만
        </button>
      </div>
      <div className="storage-grid">
        {groups.map((g) => (
          <FragmentSection key={g.type} label={FLAVOR_TYPE_LABELS[g.type]}>
            {g.items.map((f) => (
              <button
                key={f.id}
                className={`storage-item ${f.available ? '' : 'unavailable'}`}
                onClick={() => onItemTap(f.id)}
              >
                <div className="storage-tub" style={{ textShadow: `0 0 10px ${f.color}` }}>
                  🍨
                </div>
                <div className="storage-name">{f.name}</div>
                <div className={`storage-count ${(storage[f.id] ?? 0) === 0 ? 'empty' : (storage[f.id] ?? 0) < targetPar ? 'low' : ''}`}>
                  {storage[f.id] ?? 0}통
                </div>
                {!f.available && <div className="storage-badge">판매중지</div>}
              </button>
            ))}
          </FragmentSection>
        ))}
      </div>
    </>
  )
}

// Section header spanning the grid, followed by its items (both are grid children).
function FragmentSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="storage-section">{label}</div>
      {children}
    </>
  )
}
