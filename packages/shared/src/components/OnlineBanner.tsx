import { useEffect, useState } from 'react'

/** A thin banner shown when the tablet loses its internet connection, so the
 *  owner knows why saves might not be going through. */
export function OnlineBanner() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (online) return null
  return <div className="offline-banner">📴 인터넷 연결 안 됨 — 변경사항이 저장되지 않을 수 있어요</div>
}
