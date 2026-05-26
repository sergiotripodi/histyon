/**
 * GET /api/cron/cleanup-rejected
 *
 * Vercel Cron Job — gira ogni notte alle 03:00 UTC.
 * Elimina definitivamente gli account dottore con status='rejected'
 * la cui deletion_scheduled_at è trascorsa.
 *
 * Protezione: CRON_SECRET header (Vercel lo invia automaticamente).
 */

import { NextResponse }               from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { logger }                      from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    logger.error('cron/cleanup-rejected: CRON_SECRET not set — refusing to run')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Find profiles due for deletion
  const { data: toDelete, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('status', 'rejected')
    .lte('deletion_scheduled_at', new Date().toISOString())

  if (fetchErr) {
    logger.error('cron/cleanup-rejected: fetch error', { code: fetchErr.code, msg: fetchErr.message })
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!toDelete || toDelete.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 })
  }

  // Process in batches to avoid long-running requests or memory spikes
  const BATCH_SIZE = 20
  let deleted = 0
  let failed  = 0

  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = toDelete.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(async ({ id }) => {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (error) {
        logger.error('cron/cleanup-rejected: deleteUser failed', { userId: id, msg: error.message })
        failed++
      } else {
        deleted++
      }
    }))
  }

  logger.info('cron/cleanup-rejected: run complete', { total: toDelete.length, deleted, failed })
  return NextResponse.json({ ok: true, deleted, failed })
}
