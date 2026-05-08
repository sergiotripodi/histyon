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

  const supabase = await createClient()

  // PKCE flow — code param (signup confirmation, password recovery)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const destination = next === 'update-password'
        ? `${base}/auth/update-password`
        : `${base}/auth/verified`
      return NextResponse.redirect(destination)
    }
  }

  // OTP / token_hash flow — email OTP confirmation
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      const destination = type === 'recovery'
        ? `${base}/auth/update-password`
        : `${base}/auth/verified`
      return NextResponse.redirect(destination)
    }
  }

  return NextResponse.redirect(`${base}/auth/login?error=oauth_failed`)
}
