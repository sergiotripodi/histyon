import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Rate limiting maps ─────────────────────────────────────────────────────────

const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_ATTEMPTS = 10

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > LOGIN_MAX_ATTEMPTS
}

const signupAttempts = new Map<string, { count: number; resetAt: number }>()
const SIGNUP_WINDOW_MS = 60 * 60 * 1000
const SIGNUP_MAX_ATTEMPTS = 5

function isSignupRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = signupAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    signupAttempts.set(ip, { count: 1, resetAt: now + SIGNUP_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > SIGNUP_MAX_ATTEMPTS
}

// Stricter limit for the admin console login (5 attempts / 15 min)
const adminLoginAttempts = new Map<string, { count: number; resetAt: number }>()
const ADMIN_LOGIN_MAX_ATTEMPTS = 5

function isAdminLoginRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = adminLoginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    adminLoginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > ADMIN_LOGIN_MAX_ATTEMPTS
}

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

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (request.method === 'POST') {
    if (pathname === '/auth/login' && isLoginRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    if (pathname === '/auth/register' && isSignupRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    if (pathname === '/ops-histyon-console/login' && isAdminLoginRateLimited(ip)) {
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
      // Authenticated but not admin — sign them out and send to the public login
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
    const authAllowlist = ['/update-password', '/mfa-setup', '/mfa-challenge']
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
