import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { DZI_BUCKET } from '@/lib/storage/supabase'

// Proxy autenticato per le tile DZI — bucket scottea-dzi PRIVATO.
//
// I path storage sono deterministici (nessuna colonna nel DB):
//   dzi   → {doctor_id}/{patient_id}/{ticketId}.dzi
//   tiles → {doctor_id}/{patient_id}/{ticketId}_files/{level}/{col}_{row}.jpg
//
// La query DB verifica solo ownership (doctor_id) e restituisce patient_id
// per ricostruire il path. Risultato cachato 1h — zero query per tile successive.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Cached: restituisce patient_id solo se il medico è proprietario del ticket.
// 1 query DB per (ticket, medico) ogni ora.
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string; path: string[] }> }
) {
  const { ticketId, path } = await params

  if (!ticketId || !UUID_RE.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket' }, { status: 400 })
  }

  // Auth: sessione Supabase dal cookie
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verifica ownership (dalla cache dopo il primo accesso)
  const patientId = await getCachedPatientId(ticketId, user.id)
  if (!patientId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Path deterministico — nessuna colonna storage nel DB
  // base = {doctor_id}/{patient_id}/
  // file = {ticketId}.dzi | {ticketId}_files/{level}/{col}_{row}.jpg
  const filePath = path.join('/')
  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const bucketPath = `${user.id}/${patientId}/${filePath}`

  // Signed URL 60s → redirect al CDN Supabase
  const admin = adminClient()
  const { data: signed, error: signErr } = await admin.storage
    .from(DZI_BUCKET)
    .createSignedUrl(bucketPath, 60)

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}
