import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    new URL(request.url).origin

  const authNext = request.cookies.get('histyon_auth_next')?.value
  const isRecovery = next === 'update-password' || authNext === 'update-password' || type === 'recovery'

  // Collect cookies Supabase wants to set, then apply them to the final response
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => { pendingCookies.push(...cookies) },
      },
    }
  )

  let success = false

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) success = true
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) success = true
  }

  const destination = success
    ? isRecovery ? `${base}/auth/update-password` : `${base}/auth/mfa-setup`
    : `${base}/auth/login?error=oauth_failed`

  const response = NextResponse.redirect(destination)

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  }
  response.cookies.set('histyon_auth_next', '', { maxAge: 0, path: '/' })

  return response
}
