import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDemoClient } from './demoClient'

/** Demo mode: run against an in-memory fake backend (no Supabase needed).
 *  Enabled via `npm run demo` (VITE_DEMO=1). */
export const IS_DEMO = import.meta.env.VITE_DEMO === '1'

function makeClient(): SupabaseClient {
  if (IS_DEMO) {
    return createDemoClient() as unknown as SupabaseClient
  }

  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Supabase 환경변수가 없습니다. .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 설정하거나, `npm run demo` 로 데모 모드를 실행하세요.',
    )
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false }, // custom PIN login, not Supabase Auth sessions
  })
}

export const supabase = makeClient()
