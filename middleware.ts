import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limiter (resets per Vercel function instance).
// Primary protection is Supabase Auth's server-side rate limiting.
// Configure stricter limits in Supabase Dashboard → Auth → Rate Limits.
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
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

  // Rate-limit login POST attempts by IP
  if (request.method === 'POST' && request.nextUrl.pathname === '/auth/login') {
    const ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'
    if (isLoginRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  // Forward Supabase auth params that land on the root to the callback route
  const { searchParams, pathname } = request.nextUrl
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

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    const authAllowlist = ['/verified', '/update-password']
    const isAllowed = authAllowlist.some(p => request.nextUrl.pathname.includes(p))
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}