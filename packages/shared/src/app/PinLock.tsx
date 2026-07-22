import { useState } from 'react'
import { Delete } from 'lucide-react'
import { getStoredPin, markUnlocked } from './pin'
import '@shared/styles/pinlock.css'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [entered, setEntered] = useState('')
  const [error, setError] = useState(false)

  const press = (digit: string) => {
    if (entered.length >= 4) return
    const next = entered + digit
    setError(false)
    if (next.length === 4) {
      if (next === getStoredPin()) {
        markUnlocked()
        onUnlock()
      } else {
        setError(true)
        setTimeout(() => setEntered(''), 400)
        setEntered(next)
      }
    } else {
      setEntered(next)
    }
  }

  const back = () => setEntered((e) => e.slice(0, -1))

  return (
    <div className="pinlock">
      <div className="pinlock-logo">🍨</div>
      <div className="pinlock-title">비밀번호 입력</div>
      <div className={`pin-dots ${error ? 'error' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pin-dot ${i < entered.length ? 'filled' : ''}`} />
        ))}
      </div>
      <div className="pin-error">{error ? '비밀번호가 틀렸습니다' : ''}</div>
      <div className="keypad">
        {KEYS.map((k) => (
          <button key={k} className="key" onClick={() => press(k)}>
            {k}
          </button>
        ))}
        <span />
        <button className="key" onClick={() => press('0')}>
          0
        </button>
        <button className="key key-icon" onClick={back} aria-label="지우기">
          <Delete size={28} />
        </button>
      </div>
    </div>
  )
}
