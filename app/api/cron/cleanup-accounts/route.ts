/**
 * GET /api/cron/cleanup-accounts
 *
 * Vercel Cron Job — runs every day at 03:00 UTC.
 *
 * Phase 1 — Warning emails (7 days before deletion):
 *   Find accounts where deletion_scheduled_at is within the next 7 days
 *   AND deletion_warning_sent_at IS NULL.
 *   Send a pre-deletion warning email + set deletion_warning_sent_at.
 *
 * Phase 2 — Account deletion:
 *   Find accounts where deletion_scheduled_at <= now().
 *   For each: send final notification, delete all data (RPC + auth),
 *   log to admin_activity_logs (admin_id = null = system action).
 *
 * Legal basis: GDPR Art. 5(1)(e) storage limitation + Art. 17 right to erasure.
 *
 * Protection: Authorization: Bearer <CRON_SECRET> header (sent by Vercel automatically).
 */

import { NextResponse }    from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger }           from '@/lib/logger'
import type { Json }        from '@/types/database'
import {
  sendAccountDeletionWarningEmail,
  sendAccountAutoDeletedEmail,
} from '@/lib/email'

export const dynamic = 'force-dynamic'

// ─── Auth guard ───────────────────────────────────────────────────────────────

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    logger.error('cron/cleanup-accounts: CRON_SECRET not set')
    return false
  }
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DeletionReason = 'rejected' | 'suspended_expired' | 'user_requested'

type PendingRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  deletion_reason: DeletionReason | null
  deletion_scheduled_at: string
  deletion_warning_sent_at: string | null
}

// ─── Helper: run delete_doctor_data RPC + auth.admin.deleteUser ───────────────

async function deleteDoctorAccount(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  // 1. Atomically delete all DB data (egress_logs, tickets, patients, profiles)
  const { error: rpcErr } = await admin.rpc('delete_doctor_data', { p_doctor_id: userId })
  if (rpcErr) return { ok: false, error: `RPC: ${rpcErr.message}` }

  // 2. Delete the auth identity last (auth is source of truth)
  const { error: authErr } = await admin.auth.admin.deleteUser(userId)
  if (authErr) return { ok: false, error: `auth: ${authErr.message}` }

  return { ok: true }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now   = new Date()

  // ── Phase 1: Warning emails (deletion within 7 days, warning not yet sent) ──
  const warningDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { data: warnRows, error: warnFetchErr } = await admin
    .from('profiles')
    .select('id, email, first_name, last_name, deletion_reason, deletion_scheduled_at, deletion_warning_sent_at')
    .in('status', ['rejected', 'suspended'])
    .lte('deletion_scheduled_at', warningDeadline.toISOString())
    .gt('deletion_scheduled_at', now.toISOString())       // not yet expired
    .is('deletion_warning_sent_at', null)

  if (warnFetchErr) {
    logger.error('cron/cleanup-accounts: warning fetch error', { msg: warnFetchErr.message })
  }

  let warned = 0
  for (const row of (warnRows ?? []) as PendingRow[]) {
    if (!row.email) continue
    const name   = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Dottore'
    const reason = (row.deletion_reason ?? 'rejected') as 'rejected' | 'suspended_expired'
    const dateStr = new Date(row.deletion_scheduled_at).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    try {
      await sendAccountDeletionWarningEmail(row.email, name, dateStr, reason)
      await admin
        .from('profiles')
        .update({ deletion_warning_sent_at: now.toISOString() })
        .eq('id', row.id)
      warned++
    } catch (err) {
      logger.warn('cron/cleanup-accounts: warning email failed', { id: row.id, err })
    }
  }

  // ── Phase 2: Delete expired accounts ─────────────────────────────────────
  const { data: toDelete, error: deleteFetchErr } = await admin
    .from('profiles')
    .select('id, email, first_name, last_name, deletion_reason, deletion_scheduled_at, deletion_warning_sent_at')
    .in('status', ['rejected', 'suspended'])
    .lte('deletion_scheduled_at', now.toISOString())

  if (deleteFetchErr) {
    logger.error('cron/cleanup-accounts: delete fetch error', { msg: deleteFetchErr.message })
    return NextResponse.json({ error: deleteFetchErr.message }, { status: 500 })
  }

  if (!toDelete || toDelete.length === 0) {
    logger.info('cron/cleanup-accounts: no accounts due for deletion', { warned })
    return NextResponse.json({ ok: true, warned, deleted: 0, failed: 0 })
  }

  const BATCH = 20
  let deleted  = 0
  let failed   = 0

  for (let i = 0; i < toDelete.length; i += BATCH) {
    const batch = (toDelete as PendingRow[]).slice(i, i + BATCH)

    await Promise.all(batch.map(async (row) => {
      const name   = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Dottore'
      const reason = (row.deletion_reason ?? 'rejected') as 'rejected' | 'suspended_expired'

      // Send final notification BEFORE deleting (while email is still accessible)
      if (row.email) {
        sendAccountAutoDeletedEmail(row.email, name, reason)
          .catch(err => logger.warn('cron/cleanup-accounts: auto-deleted email failed', { id: row.id, err }))
      }

      const result = await deleteDoctorAccount(admin, row.id)

      if (!result.ok) {
        logger.error('cron/cleanup-accounts: deletion failed', { id: row.id, error: result.error })
        failed++
        return
      }

      // Log the system deletion in admin_activity_logs (admin_id = null = automated)
      admin.from('admin_activity_logs').insert({
        admin_id:       null,
        action:         'account_auto_deleted',
        target_user_id: null,          // already deleted — FK would fail; store in metadata
        success:        true,
        metadata:       ({ deleted_user_id: row.id, reason } as Json),
      }).then(
        ({ error: logErr }) => { if (logErr) logger.warn('cron/cleanup-accounts: audit log failed', { logErr }) },
        (err: unknown) => logger.warn('cron/cleanup-accounts: audit log failed', { err }),
      )

      deleted++
    }))
  }

  logger.info('cron/cleanup-accounts: run complete', {
    total: toDelete.length, warned, deleted, failed,
  })

  return NextResponse.json({ ok: true, warned, deleted, failed })
}
