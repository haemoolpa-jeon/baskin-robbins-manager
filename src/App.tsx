import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { PinLock } from '@/app/PinLock'
import { hasPin, isUnlocked } from '@/app/pin'

export default function App() {
  const [locked, setLocked] = useState(() => hasPin() && !isUnlocked())
  if (locked) return <PinLock onUnlock={() => setLocked(false)} />
  return <AppShell />
}
