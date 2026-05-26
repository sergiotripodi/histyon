import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { TISSUES_BUCKET } from '@/lib/storage/supabase'

// Proxy autenticato per le tile DZI — bucket scottea-tissues PRIVATO.
//
// Path storage deterministici:
//   dzi  → dzi/{doctor_id}/{patient_id}/{ticketId}.dzi
//   tile → dzi/{doctor_id}/{patient_id}/{ticketId}_files/{level}/{col}_{row}.jpg
//
// 1 query DB per (ticket, dottore) ogni ora (unstable_cache).
// Egress loggato in fire-and-forget su egress_logs per attribuzione per-dottore.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getCachedPatientId(ticketId: string, userId: string) {
  return unstable_cache(
    async () => {
      const admin = adminClient()
      const { data } = await admin
        .from('tickets')
        .select('patient_id')
        .eq('id', ticketId)
        .eq('doctor_id', userId)
        .maybeSingle()
      return (data?.patient_id as string) ?? null
    },
    [`tile-auth-${ticketId}-${userId}`],
    { revalidate: 3600 }
  )()
}

// Logga l'egress del tile in modo asincrono (fire-and-forget).
// Recupera la dimensione esatta dal metadata storage, poi scrive su egress_logs.
async function logTileEgress(
  doctorId: string,
  ticketId: string,
  bucketPath: string
): Promise<void> {
  try {
    const admin = adminClient()
    const parts    = bucketPath.split('/')
    const filename = parts.pop()!
    const dir      = parts.join('/')

    const { data: listed } = await admin.storage
      .from(TISSUES_BUCKET)
      .list(dir, { limit: 1, search: filename })

    const bytes = listed?.[0]?.metadata?.size ?? 0
    if (bytes <= 0) return

    await admin.from('egress_logs').insert({
      doctor_id: doctorId,
      ticket_id: ticketId,
      source:    'tile_view',
      bytes,
    })
  } catch {
    // non-critical — non bloccare la risposta
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string; path: string[] }> }
) {
  const { ticketId, path } = await params

  if (!ticketId || !UUID_RE.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const patientId = await getCachedPatientId(ticketId, user.id)
  if (!patientId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const filePath = path.join('/')
  // Reject traversal attempts: double-dots, null bytes, URL-encoded sequences,
  // or any char outside the safe set for DZI paths (word chars, dots, hyphens, slashes).
  if (
    filePath.startsWith('/') ||
    filePath.includes('..') ||
    filePath.includes('\x00') ||
    filePath.includes('%') ||
    !/^[\w.\-/]+$/.test(filePath)
  ) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  // Tutte le risorse DZI vivono sotto dzi/ nel bucket unificato
  const bucketPath = `dzi/${user.id}/${patientId}/${filePath}`

  const admin = adminClient()
  const { data: signed, error: signErr } = await admin.storage
    .from(TISSUES_BUCKET)
    .createSignedUrl(bucketPath, 60)

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // Egress logging asincrono — non aspettiamo, non rallenta la risposta
  void logTileEgress(user.id, ticketId, bucketPath)

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}
