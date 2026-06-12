// Read-only check of the Supabase backend (v2 — no accounts).
// Run: node scripts/verify-supabase.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

const store = await sb.from('stores').select('*').limit(1).single()
console.log('1) store:', JSON.stringify(store.data), '| error:', store.error?.message ?? 'none')

const flavors = await sb.from('flavors').select('id').limit(1000)
console.log('2) flavors:', flavors.data?.length ?? null, '| error:', flavors.error?.message ?? 'none')

const log = await sb.from('activity_log').select('id').limit(1)
console.log('3) activity_log reachable:', log.error ? `NO (${log.error.message})` : 'yes')
