// Per-device "unlocked this session" state for the store-wide app-lock PIN.
// The PIN itself lives on the store row in Supabase (see data/store.ts), so it
// applies on every device; this module only tracks whether THIS device/session
// has already been unlocked. Soft lock by design — low stakes.
const UNLOCK_KEY = 'br_unlocked'

export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCK_KEY) === '1'
}
export function markUnlocked() {
  sessionStorage.setItem(UNLOCK_KEY, '1')
}
export function lockSession() {
  sessionStorage.removeItem(UNLOCK_KEY)
}
