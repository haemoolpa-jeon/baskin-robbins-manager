// Optional local app-lock PIN. Device-local only (no backend) — a soft lock so a
// part-timer can't peek at payroll on the store tablet. Low stakes by design.
const PIN_KEY = 'br_lock_pin'
const UNLOCK_KEY = 'br_unlocked'

export function getStoredPin(): string | null {
  return localStorage.getItem(PIN_KEY)
}
export function setStoredPin(pin: string | null) {
  if (pin) localStorage.setItem(PIN_KEY, pin)
  else localStorage.removeItem(PIN_KEY)
  // changing the PIN re-locks the session
  sessionStorage.removeItem(UNLOCK_KEY)
}
export function hasPin(): boolean {
  return !!getStoredPin()
}
export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCK_KEY) === '1'
}
export function markUnlocked() {
  sessionStorage.setItem(UNLOCK_KEY, '1')
}
