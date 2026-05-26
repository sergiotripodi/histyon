import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendAccountSuspendedEmail } from '@/lib/email'

const UUID_RE        = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_REASON_LEN = 1000
const NO_CACHE       = { 'Cache-Control': 'no-store' } as const

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json() as { reason?: unknown }
  const reason = typeof body?.reason === 'string' ? body.reason : ''
  if (!reason.trim()) return NextResponse.json({ error: 'Reason required' }, { status: 400 })
  const trimmedReason = reason.trim().slice(0, MAX_REASON_LEN)

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
    .select('email, first_name, last_name')
    .eq('id', id)
    .single()

  if (fetchErr || !profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Update status
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      status: 'suspended',
      status_reason: trimmedReason,
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email
  const doctorName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Dottore'
  await sendAccountSuspendedEmail(profile.email, doctorName, trimmedReason).catch(console.error)

  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
