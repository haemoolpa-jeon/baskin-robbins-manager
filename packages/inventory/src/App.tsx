import { useState } from 'react'
import { AppShell } from './AppShell'
import { PinLock } from '@shared/app/PinLock'
import { isUnlocked } from '@shared/app/pin'
import { useApp } from '@shared/app/AppProvider'
import { Spinner } from '@shared/components/Spinner'

export default function App() {
  const { appPin, isLoading } = useApp()
  const [unlocked, setUnlocked] = useState(isUnlocked())

  if (isLoading) return <Spinner center />
  if (appPin && !unlocked) return <PinLock expectedPin={appPin} onUnlock={() => setUnlocked(true)} />
  return <AppShell />
}
