import { NextRequest, NextResponse } from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { NO_CACHE }      from '@/lib/api-utils'

// ─── Action groups ────────────────────────────────────────────────────────────

const ACCESS_ACTIONS   = ['login', 'logout', 'mfa_enrolled', 'mfa_verified']
const ACTIVITY_ACTIONS = [
  'profile_updated', 'email_change_requested', 'password_changed',
  'patient_created', 'patient_deleted',
  'ticket_created', 'ticket_deleted',
  'account_deleted',
]

const PAGE_SIZE = 10

// ─── GET /api/logs/doctor?type=access|activity&cursor=<ISO> ──────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE })

  const sp      = req.nextUrl.searchParams
  const type    = sp.get('type') === 'activity' ? 'activity' : 'access'
  const cursor  = sp.get('cursor') ?? null           // ISO timestamp of last item

  const actions = type === 'access' ? ACCESS_ACTIONS : ACTIVITY_ACTIONS

  // RLS policy: doctor_activity_logs SELECT USING (doctor_id = auth.uid())
  // so the regular client handles auth — no admin client needed.
  let query = supabase
    .from('doctor_activity_logs')
    .select('id, action, success, ip_address, user_agent, created_at')
    .eq('doctor_id', user.id)
    .in('action', actions)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)  // fetch 1 extra to detect hasMore

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE })

  const hasMore = (data?.length ?? 0) > PAGE_SIZE
  const logs    = hasMore ? data!.slice(0, PAGE_SIZE) : (data ?? [])

  return NextResponse.json({ logs, hasMore }, { headers: NO_CACHE })
}
