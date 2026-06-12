import type { CabinetName, Cabinets, Flavor, RowName, Slot } from '@/lib/types'
import type { SlotPos } from '@/data/cabinets'
import { SLOTS_PER_ROW } from '@/data/cabinets'

interface Props {
  cabinet: CabinetName
  cabinets: Cabinets
  flavorsById: Map<number, Flavor>
  moveSource: SlotPos | null
  onSlotTap: (pos: SlotPos) => void
}

export function CabinetView({ cabinet, cabinets, flavorsById, moveSource, onSlotTap }: Props) {
  const data = cabinets[cabinet]
  const renderRow = (row: RowName, label: string) => (
    <div className="cab-section">
      <div className="cab-label">{label}</div>
      <div className="cab-grid">
        {Array.from({ length: SLOTS_PER_ROW }, (_, i) => {
          const pos: SlotPos = { cabinet, row, position: i }
          return (
            <SlotCell
              key={`${row}-${i}`}
              slot={data[row][i]}
              flavor={data[row][i] ? flavorsById.get(data[row][i]!.flavorId) : undefined}
              moveActive={!!moveSource}
              isSource={
                !!moveSource &&
                moveSource.cabinet === cabinet &&
                moveSource.row === row &&
                moveSource.position === i
              }
              onTap={() => onSlotTap(pos)}
            />
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="cabinet">
      {renderRow('top', '🔝 진열중 (위)')}
      <div className="cab-divider" />
      {renderRow('bottom', '⬇️ 대기 (아래)')}
    </div>
  )
}

function SlotCell({
  slot,
  flavor,
  moveActive,
  isSource,
  onTap,
}: {
  slot: Slot | null
  flavor?: Flavor
  moveActive: boolean
  isSource: boolean
  onTap: () => void
}) {
  if (!slot) {
    return (
      <button
        className={`slot empty ${moveActive ? 'move-target' : ''}`}
        onClick={onTap}
        aria-label="빈 칸"
      >
        <span className="slot-empty">+</span>
      </button>
    )
  }
  const levelClass = slot.level <= 20 ? 'critical' : slot.level <= 50 ? 'low' : ''
  return (
    <button
      className={`slot filled ${levelClass} ${moveActive ? 'move-target' : ''} ${isSource ? 'is-source' : ''}`}
      style={{ ['--slot-color' as string]: flavor?.color ?? '#ccc' }}
      onClick={onTap}
      aria-label={flavor?.name ?? '맛'}
    >
      <span className="slot-tub">🍨</span>
      <span className="slot-name">{flavor?.name ?? '?'}</span>
      <span className="slot-pct">{slot.level}%</span>
      <div className="slot-level">
        <div className="level-fill" style={{ width: `${slot.level}%` }} />
      </div>
    </button>
  )
}
