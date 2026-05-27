import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NO_CACHE }     from '@/lib/api-utils'

// DELETE /api/sessions/revoke
// Body: { sessionId: string }
//
// Calls the SECURITY DEFINER function revoke_session(UUID) which checks
// auth.uid() == sessions.user_id — users can only revoke their own sessions.
// Cascades to auth.refresh_tokens, fully invalidating the session.

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE })

  let sessionId: string
  try {
    const body = await req.json()
    sessionId  = body.sessionId
    if (!sessionId || typeof sessionId !== 'string') throw new Error()
  } catch {
    return NextResponse.json({ error: 'sessionId richiesto' }, { status: 400, headers: NO_CACHE })
  }

  const { error } = await supabase.rpc('revoke_session', { p_session_id: sessionId })
  if (error) {
    return NextResponse.json({ error: 'Revoca sessione fallita' }, { status: 500, headers: NO_CACHE })
  }

  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
