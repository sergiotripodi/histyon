import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendAccountApprovedEmail } from '@/lib/email'

const UUID_RE   = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const NO_CACHE  = { 'Cache-Control': 'no-store' } as const

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers: NO_CACHE })

  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: caller } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch target profile
  const { data: profile, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('email, first_name, last_name, status')
    .eq('id', id)
    .single()

  if (fetchErr || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (profile.status === 'approved') return NextResponse.json({ error: 'Already approved' }, { status: 409 })

  // Update status
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'approved', status_reason: null, status_updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email
  const doctorName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Dottore'
  await sendAccountApprovedEmail(profile.email, doctorName).catch(console.error)

  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
