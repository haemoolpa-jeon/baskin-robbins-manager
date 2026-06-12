import { useMemo, useState } from 'react'
import { FLAVOR_TYPE_LABELS, FLAVOR_TYPE_ORDER, type Flavor, type Storage } from '@/lib/types'

interface Props {
  flavors: Flavor[]
  storage: Storage
  canEdit: boolean
  onItemTap: (flavorId: number) => void
  onAdd: () => void
}

export function StorageView({ flavors, storage, canEdit, onItemTap, onAdd }: Props) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = flavors.filter((f) => !q || f.name.toLowerCase().includes(q))
    return FLAVOR_TYPE_ORDER.map((t) => ({
      type: t,
      items: filtered.filter((f) => f.type === t),
    })).filter((g) => g.items.length > 0)
  }, [flavors, query])

  return (
    <>
      <input
        className="input storage-search"
        placeholder="🔍 맛 검색…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
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
                <div className="storage-count">{storage[f.id] ?? 0}통</div>
                {!f.available && <div className="storage-badge">판매중지</div>}
              </button>
            ))}
          </FragmentSection>
        ))}
        {canEdit && (
          <button className="storage-item add-item" onClick={onAdd}>
            <div className="add-icon">+</div>
            <div className="storage-name">새 맛 추가</div>
          </button>
        )}
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
