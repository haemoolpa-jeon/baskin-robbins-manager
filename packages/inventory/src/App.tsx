import { useState } from 'react'
import { AppShell } from './AppShell'
import { PinLock } from '@shared/app/PinLock'
import { hasPin, isUnlocked } from '@shared/app/pin'

export default function App() {
  const [locked, setLocked] = useState(() => hasPin() && !isUnlocked())
  if (locked) return <PinLock onUnlock={() => setLocked(false)} />
  return <AppShell />
}
