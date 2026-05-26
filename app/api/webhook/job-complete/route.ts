import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// Chiamato dal DB trigger (pg_net) quando un ticket diventa COMPLETED.
// Aggiorna il DB con: status, results (analisi AI), annotations (GeoJSON).
// Su COMPLETED: logga l'egress del download AI (input_bytes del ticket → egress_logs).
// Protetto da WEBHOOK_SECRET in Authorization header.

export async function POST(request: Request) {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    ticketId?:    string
    status?:      string
    results?:     unknown
    annotations?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ticketId, status, results, annotations } = body

  if (!ticketId || typeof ticketId !== 'string' || !/^[0-9a-f-]{36}$/i.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticketId' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const update: Record<string, unknown> = {}

  let normalizedStatus: string | null = null
  if (status) {
    normalizedStatus = ['FAILED_ANALYSIS', 'FAILED', 'FAIL'].includes(status) ? 'ERROR' : status
    if (['COMPLETED', 'ERROR', 'PROCESSING'].includes(normalizedStatus)) {
      update.status = normalizedStatus
    } else {
      normalizedStatus = null
    }
  }

  if (results !== undefined && results !== null) update.results = results
  if (annotations !== undefined && annotations !== null) update.annotations = annotations

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tickets')
    .update(update)
    .eq('id', ticketId)

  if (error) {
    logger.error('webhook/job-complete: DB update failed', { ticketId, code: error.code, msg: error.message })
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (normalizedStatus === 'COMPLETED') {
    // Invalida la cache delle dashboard — il DZI è appena stato scritto
    revalidatePath('/ops-histyon-console', 'layout')
    revalidatePath('/dashboard', 'layout')

    // Logga egress download AI in fire-and-forget (non-critical)
    void (async () => {
      try {
        const { data: ticket } = await supabase
          .from('tickets')
          .select('doctor_id, input_bytes')
          .eq('id', ticketId)
          .single()

        if (ticket?.doctor_id && ticket?.input_bytes && ticket.input_bytes > 0) {
          await supabase.from('egress_logs').insert({
            doctor_id: ticket.doctor_id,
            ticket_id: ticketId,
            source:    'input_download',
            bytes:     ticket.input_bytes,
          })
        }
      } catch {
        // non-critical
      }
    })()
  }

  return NextResponse.json({ ok: true })
}
