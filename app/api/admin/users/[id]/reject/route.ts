import { NextResponse } from 'next/server'
import { requireAdmin, validateUUID, NO_CACHE } from '@/lib/api-utils'
import { AdminReasonSchema } from '@/lib/schemas'
import { sendAccountRejectedEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { logAdminActivity } from '@/lib/audit'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uuidErr = validateUUID(id)
  if (uuidErr) return uuidErr

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: NO_CACHE })
  }
  const parsed = AdminReasonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400, headers: NO_CACHE })
  }
  const { reason } = parsed.data

  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { admin, adminId } = auth

  const { data: profile, error: fetchErr } = await admin
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', id)
    .single()

  if (fetchErr || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404, headers: NO_CACHE })

  // GDPR Art. 5(1)(e) — minimizzazione: 7 giorni danno al dottore il tempo
  // di leggere l'email e contattarci, senza trattenere dati più del necessario.
  const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const { error } = await admin
    .from('profiles')
    .update({
      status: 'rejected',
      status_reason: reason,
      status_updated_at: new Date().toISOString(),
      deletion_scheduled_at: deletionDate.toISOString(),
      deletion_reason: 'rejected',
    })
    .eq('id', id)

  if (error) {
    logger.error('reject: DB update failed', { id, code: error.code })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: NO_CACHE })
  }

  logAdminActivity(adminId, 'user_rejected', { targetUserId: id, metadata: { reason } }).catch(() => {})

  const doctorName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Dottore'
  const deletionDateStr = deletionDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  sendAccountRejectedEmail(profile.email, doctorName, reason, deletionDateStr)
    .catch(err => logger.warn('reject: email failed', { id, err }))

  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
