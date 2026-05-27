import { NextResponse } from 'next/server'
import { requireAdmin, validateUUID, NO_CACHE } from '@/lib/api-utils'
import { sendAccountReactivatedEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { logAdminActivity } from '@/lib/audit'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uuidErr = validateUUID(id)
  if (uuidErr) return uuidErr

  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { admin, adminId } = auth

  const { data: profile, error: fetchErr } = await admin
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', id)
    .single()

  if (fetchErr || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: NO_CACHE })

  const { error } = await admin
    .from('profiles')
    .update({
      status: 'approved',
      status_reason: null,
      status_updated_at: new Date().toISOString(),
      // Clear all scheduled-deletion fields on reactivation
      deletion_scheduled_at: null,
      deletion_reason: null,
      deletion_warning_sent_at: null,
    })
    .eq('id', id)

  if (error) {
    logger.error('reactivate: DB update failed', { id, code: error.code })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: NO_CACHE })
  }

  logAdminActivity(adminId, 'user_reactivated', { targetUserId: id }).catch(() => {})

  const doctorName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Dottore'
  sendAccountReactivatedEmail(profile.email, doctorName)
    .catch(err => logger.warn('reactivate: email failed', { id, err }))

  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
