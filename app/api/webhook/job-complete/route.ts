import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Chiamato dallo script Python AI al termine dell'elaborazione.
// Aggiorna il DB con: status, path DZI in Supabase Storage, annotazioni vettoriali (JSONB).
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
    dzi_path?:    string      // path nel bucket histyon-dzi, es. {userId}/{patientId}/{ticketId}.dzi
    tissue?:      unknown     // JSONB analisi tessuto
    annotations?: unknown     // JSONB annotazioni vettoriali (GeoJSON FeatureCollection)
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ticketId, status, dzi_path, tissue, annotations } = body

  if (!ticketId || typeof ticketId !== 'string' || !/^[0-9a-f-]{36}$/i.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticketId' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const update: Record<string, unknown> = {}

  if (status) {
    const normalized = ['FAILED_ANALYSIS', 'FAILED', 'FAIL'].includes(status) ? 'ERROR' : status
    if (['COMPLETED', 'ERROR', 'PROCESSING'].includes(normalized)) {
      update.status = normalized
    }
  }

  if (typeof dzi_path === 'string' && dzi_path.trim().length > 0) {
    update.output_dzi = dzi_path.trim()
  }

  if (tissue !== undefined && tissue !== null) {
    update.tissue = tissue
  }

  if (annotations !== undefined && annotations !== null) {
    update.annotations = annotations
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tickets')
    .update(update)
    .eq('id', ticketId)

  if (error) {
    console.error('webhook/job-complete:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
