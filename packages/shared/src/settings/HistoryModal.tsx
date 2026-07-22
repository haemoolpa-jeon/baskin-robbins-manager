import { Modal } from '@shared/components/Modal'
import { Spinner } from '@shared/components/Spinner'
import { useApp } from '@shared/app/AppProvider'
import { useActivity, type Activity } from '@shared/data/activity'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

function dayLabel(at: number): string {
  const d = new Date(at)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`
}
function timeLabel(at: number): string {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function HistoryModal({ onClose }: { onClose: () => void }) {
  const { storeId } = useApp()
  const { data, isLoading } = useActivity(storeId)

  // Group entries by calendar day (already sorted newest-first).
  const groups: { day: string; items: Activity[] }[] = []
  for (const a of data ?? []) {
    const day = dayLabel(a.at)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(a)
    else groups.push({ day, items: [a] })
  }

  return (
    <Modal
      title="변경 기록"
      onClose={onClose}
      actions={
        <button className="btn btn-block" onClick={onClose}>
          닫기
        </button>
      }
    >
      {isLoading ? (
        <Spinner center />
      ) : groups.length === 0 ? (
        <div className="empty-note">아직 기록이 없습니다</div>
      ) : (
        groups.map((g) => (
          <div key={g.day} className="hist-group">
            <div className="hist-day">{g.day}</div>
            {g.items.map((a) => (
              <div className="hist-row" key={a.id}>
                <span className={`hist-cat cat-${a.category}`}>{a.category}</span>
                <span className="hist-msg">{a.message}</span>
                <span className="hist-time">{timeLabel(a.at)}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </Modal>
  )
}
