import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, NO_CACHE }   from '@/lib/api-utils'

// ─── Action groups ────────────────────────────────────────────────────────────

const ACCESS_ACTIONS   = ['admin_login', 'admin_logout', 'admin_mfa_enrolled', 'admin_mfa_verified']
const ACTIVITY_ACTIONS = ['user_approved', 'user_rejected', 'user_suspended', 'user_reactivated', 'account_auto_deleted']

const PAGE_SIZE = 10

// ─── GET /api/logs/admin?type=access|activity&cursor=<ISO> ───────────────────

export async function GET(req: NextRequest) {
  const result = await requireAdmin()
  if (result instanceof Response) return result

  const { admin, adminId } = result

  const sp      = req.nextUrl.searchParams
  const type    = sp.get('type') === 'activity' ? 'activity' : 'access'
  const cursor  = sp.get('cursor') ?? null

  const actions = type === 'access' ? ACCESS_ACTIONS : ACTIVITY_ACTIONS

  let query = admin
    .from('admin_activity_logs')
    .select('id, action, success, ip_address, user_agent, target_user_id, created_at')
    .eq('admin_id', adminId)
    .in('action', actions)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE })

  const hasMore = (data?.length ?? 0) > PAGE_SIZE
  const logs    = hasMore ? data!.slice(0, PAGE_SIZE) : (data ?? [])

  return NextResponse.json({ logs, hasMore }, { headers: NO_CACHE })
}
