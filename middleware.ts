import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'

// ── Middleware ─────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  const { pathname } = request.nextUrl

  // ── Rate limiting (distributed via Vercel KV, in-memory fallback in dev) ────
  if (request.method === 'POST') {
    if (pathname === '/auth/login' && await isRateLimited(ip, 'login')) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    if (pathname === '/auth/register' && await isRateLimited(ip, 'signup')) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    if (pathname === '/ops-histyon-console/login' && await isRateLimited(ip, 'admin-login')) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  // ── Forward Supabase auth params from root to callback ─────────────────────
  const { searchParams } = request.nextUrl
  if (pathname === '/') {
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    if (code || token_hash) {
      const callbackUrl = new URL('/auth/callback', request.url)
      if (code) callbackUrl.searchParams.set('code', code)
      if (token_hash) callbackUrl.searchParams.set('token_hash', token_hash)
      if (type) callbackUrl.searchParams.set('type', type)
      const next = searchParams.get('next')
      if (next) callbackUrl.searchParams.set('next', next)
      return NextResponse.redirect(callbackUrl)
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  // ── Doctor dashboard protection ────────────────────────────────────────────
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // ── Account status check (pending / rejected / suspended) ─────────────────
  // Runs for every authenticated non-admin user.
  // Blocking pages and API routes are exempt.
  const STATUS_PAGES = ['/auth/pending', '/auth/rejected', '/auth/suspended']
  const isStatusPage = STATUS_PAGES.some(p => pathname.startsWith(p))

  if (user && !isStatusPage && !pathname.startsWith('/api/') && !pathname.startsWith('/ops-histyon-console')) {
    const { data: profileStatus } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (profileStatus?.role !== 'admin') {
      const status = profileStatus?.status ?? 'pending'
      if (status === 'pending') {
        return NextResponse.redirect(new URL('/auth/pending', request.url))
      }
      if (status === 'rejected') {
        return NextResponse.redirect(new URL('/auth/rejected', request.url))
      }
      if (status === 'suspended') {
        return NextResponse.redirect(new URL('/auth/suspended', request.url))
      }
    }
  }

  if (user && pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/ops-histyon-console/dashboard', request.url))
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
      return NextResponse.redirect(new URL('/auth/mfa-challenge', request.url))
    }
    if (aal?.nextLevel === 'aal1' && aal?.currentLevel === 'aal1') {
      return NextResponse.redirect(new URL('/auth/mfa-setup', request.url))
    }
  }

  // ── Admin console protection ───────────────────────────────────────────────
  if (pathname.startsWith('/ops-histyon-console/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/ops-histyon-console/login', request.url))
    }

    // Verify admin role via DB (cannot trust JWT claims alone)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Admin must have AAL2 (2FA completed)
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
      return NextResponse.redirect(new URL('/ops-histyon-console/mfa-challenge', request.url))
    }
    if (aal?.nextLevel === 'aal1' && aal?.currentLevel === 'aal1') {
      return NextResponse.redirect(new URL('/ops-histyon-console/mfa-setup', request.url))
    }
  }

  // Redirect authenticated admin trying to re-login
  if (user && pathname === '/ops-histyon-console/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/ops-histyon-console/dashboard', request.url))
    }
  }

  // ── Redirect authenticated doctor away from auth pages ─────────────────────
  if (user && pathname.startsWith('/auth')) {
    const authAllowlist = ['/update-password', '/mfa-setup', '/mfa-challenge', '/pending', '/rejected', '/suspended']
    const isAllowed = authAllowlist.some(p => pathname.includes(p))
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
