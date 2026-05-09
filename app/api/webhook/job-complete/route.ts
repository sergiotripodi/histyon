import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Called by the processing pipeline when a job finishes.
// Reports output file sizes so the dashboard can show accurate storage usage.
// Protected by a shared secret set in WEBHOOK_SECRET env var.

export async function POST(request: Request) {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { ticketId?: string; outputFileSizeBytes?: number; status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ticketId, outputFileSizeBytes, status } = body

  if (!ticketId || typeof ticketId !== 'string' || !/^[0-9a-f-]{36}$/i.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticketId' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const update: Record<string, unknown> = {}
  if (typeof outputFileSizeBytes === 'number' && outputFileSizeBytes >= 0) {
    update.output_file_size = outputFileSizeBytes
  }
  if (status) {
    const normalized = ['FAILED_ANALYSIS', 'FAILED', 'FAIL'].includes(status) ? 'ERROR' : status
    if (['COMPLETED', 'ERROR', 'PROCESSING'].includes(normalized)) {
      update.status = normalized
    }
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
