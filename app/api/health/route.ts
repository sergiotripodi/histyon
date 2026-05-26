import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}

  // DB connectivity
  try {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { error } = await admin.from('profiles').select('id').limit(1)
    checks.db = error ? 'error' : 'ok'
  } catch {
    checks.db = 'error'
  }

  const healthy = Object.values(checks).every(v => v === 'ok')
  const status  = healthy ? 200 : 503

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks, ts: new Date().toISOString() },
    { status },
  )
}
