import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { DZI_BUCKET } from '@/lib/storage/supabase'

// Proxy autenticato per le tile DZI.
// Flusso: auth check → verifica proprietà ticket → signed URL 60s → redirect 302.
// Il bucket scottea-dzi è privato: zero URL pubbliche esposte.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string; path: string[] }> }
) {
  const { ticketId, path } = await params

  // 1. Valida ticketId
  if (!ticketId || !UUID_RE.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket' }, { status: 400 })
  }

  // 2. Autenticazione medico (cookie session)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Verifica proprietà ticket + recupera path DZI base
  const { data: ticket } = await supabase
    .from('tickets')
    .select('output_dzi')
    .eq('id', ticketId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!ticket?.output_dzi) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 4. Costruisce il path completo nel bucket
  // output_dzi = "{userId}/{patientId}/{uuid}.dzi"
  // base        = "{userId}/{patientId}/"
  // richiesta tile = [...path] = ["uuid_files", "10", "0_0.jpeg"]
  const dziPath  = ticket.output_dzi as string
  const lastSlash = dziPath.lastIndexOf('/')
  const baseDir  = lastSlash >= 0 ? dziPath.slice(0, lastSlash + 1) : ''
  const filePath = path.join('/')

  // Sanity check: blocca path traversal
  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const bucketPath = baseDir + filePath

  // 5. Genera signed URL con service role (60s di validità)
  const admin = adminClient()
  const { data: signedData, error: signedErr } = await admin.storage
    .from(DZI_BUCKET)
    .createSignedUrl(bucketPath, 60)

  if (signedErr || !signedData?.signedUrl) {
    console.error('tiles proxy signed URL:', signedErr)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // 6. Redirect 302 → Supabase Storage serve la tile direttamente (CDN)
  //    Signed URL scade in 60s: non riutilizzabile, non condivisibile.
  return NextResponse.redirect(signedData.signedUrl, { status: 302 })
}
