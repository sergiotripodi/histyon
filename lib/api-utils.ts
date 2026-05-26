import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UUID_RE } from '@/lib/constants'

export const NO_CACHE = { 'Cache-Control': 'no-store' } as const

/**
 * Validates the caller's session and confirms they have the admin role.
 * Returns the admin Supabase client on success so the route can reuse it.
 *
 * Usage:
 *   const result = await requireAdmin()
 *   if (result instanceof NextResponse) return result   // 401 or 403
 *   const { admin } = result
 */
export async function requireAdmin(): Promise<
  { admin: ReturnType<typeof createAdminClient> } | NextResponse
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE })

  const admin = createAdminClient()
  const { data: caller } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_CACHE })
  }

  return { admin }
}

/** Validates a UUID path param. Returns a 400 response if invalid. */
export function validateUUID(id: string): NextResponse | null {
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers: NO_CACHE })
  }
  return null
}
