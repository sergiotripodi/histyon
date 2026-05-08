import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    new URL(request.url).origin

  // Read the cookie set by the resetPassword action to know the intended destination
  const req = request as Request & { cookies?: { get: (name: string) => { value: string } | undefined } }
  const cookieHeader = (request.headers.get('cookie') ?? '')
  const authNextMatch = cookieHeader.match(/histyon_auth_next=([^;]+)/)
  const authNext = authNextMatch?.[1]

  const isRecovery = next === 'update-password' || authNext === 'update-password' || type === 'recovery'

  const supabase = await createClient()

  // PKCE flow — code param (signup confirmation, password recovery)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const destination = isRecovery ? `${base}/auth/update-password` : `${base}/auth/verified`
      const res = NextResponse.redirect(destination)
      res.cookies.set('histyon_auth_next', '', { maxAge: 0, path: '/' })
      return res
    }
  }

  // OTP / token_hash flow — direct link with token hash
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      const destination = isRecovery ? `${base}/auth/update-password` : `${base}/auth/verified`
      const res = NextResponse.redirect(destination)
      res.cookies.set('histyon_auth_next', '', { maxAge: 0, path: '/' })
      return res
    }
  }

  return NextResponse.redirect(`${base}/auth/login?error=oauth_failed`)
}
