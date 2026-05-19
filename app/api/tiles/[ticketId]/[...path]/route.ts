import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { DZI_BUCKET } from '@/lib/storage/supabase'

// Proxy autenticato per le tile DZI — bucket scottea-dzi è PRIVATO.
//
// Performance: la verifica proprietà ticket (DB) viene cachata 1 ora
// con unstable_cache. Tutte le tile successive dello stesso ticket
// non fanno più query DB: solo auth cookie + signed URL (~10-20ms).
// Le tile vengono servite da Supabase CDN tramite 302 redirect.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Cached: 1 query DB per (ticket, medico) ogni ora.
// Verifica sia l'ownership che recupera il path DZI in un solo round-trip.
function getCachedDziPath(ticketId: string, userId: string) {
  return unstable_cache(
    async () => {
      const admin = adminClient()
      const { data } = await admin
        .from('tickets')
        .select('output_dzi')
        .eq('id', ticketId)
        .eq('doctor_id', userId)
        .maybeSingle()
      return (data?.output_dzi as string) ?? null
    },
    [`tile-auth-${ticketId}-${userId}`],
    { revalidate: 3600 } // cache 1h — il path DZI non cambia dopo il processing
  )()
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string; path: string[] }> }
) {
  const { ticketId, path } = await params

  if (!ticketId || !UUID_RE.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket' }, { status: 400 })
  }

  // Auth: legge il cookie di sessione Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verifica proprietà (dalla cache — nessuna query DB dopo la prima)
  const dziPath = await getCachedDziPath(ticketId, user.id)
  if (!dziPath) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Costruisce il path completo nel bucket
  // dziPath  = "{userId}/{patientId}/{uuid}.dzi"
  // baseDir  = "{userId}/{patientId}/"
  // filePath = "uuid.dzi" | "uuid_files/10/0_0.jpeg"
  const baseDir  = dziPath.slice(0, dziPath.lastIndexOf('/') + 1)
  const filePath = path.join('/')

  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const bucketPath = baseDir + filePath

  // Genera signed URL (60s) e reindirizza — Supabase CDN serve la tile
  const admin = adminClient()
  const { data: signed, error: signErr } = await admin.storage
    .from(DZI_BUCKET)
    .createSignedUrl(bucketPath, 60)

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}
