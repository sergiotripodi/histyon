import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isRateLimited } from '@/lib/rate-limit'

type ProfileData = { role: string; status: string }

// Cache profile in Vercel KV for 30s — avoids a DB round-trip on every page request.
// Falls back to a direct DB query if KV is unavailable (local dev, cold start, etc.).
async function getProfile(userId: string, supabase: ReturnType<typeof createServerClient>): Promise<ProfileData | null> {
  const kvUrl   = process.env.KV_REST_API_URL
  const kvToken = process.env.KV_REST_API_TOKEN

  if (kvUrl && kvToken) {
    try {
      const cacheKey = `profile:${userId}`
      const getRes = await fetch(`${kvUrl}/get/${cacheKey}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      })
      const { result } = await getRes.json() as { result: string | null }
      if (result) return JSON.parse(result) as ProfileData

      const { data } = await supabase.from('profiles').select('role, status').eq('id', userId).single()
      if (data) {
        await fetch(`${kvUrl}/set/${cacheKey}/ex/30`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify(JSON.stringify(data)),
        })
      }
      return data ?? null
    } catch {
      // KV unavailable — fall through to direct DB
    }
  }

  const { data } = await supabase.from('profiles').select('role, status').eq('id', userId).single()
  return data ?? null
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

  // ── Rate limiting (distributed via Vercel KV, in-memory fallback in dev) ────
  if (request.method === 'POST') {
    if (pathname === '/auth/login' && await isRateLimited(ip, 'login')) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    if (pathname === '/auth/register' && await isRateLimited(ip, 'signup')) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    if (pathname === '/tripo/login' && await isRateLimited(ip, 'admin-login')) {
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

  // ── Single profile fetch — reused for all checks below ────────────────────
  // Cached in KV for 30s to avoid a DB hit on every page request.
  const profile = user ? await getProfile(user.id, supabase) : null

  // ── Account status check (pending / rejected / suspended) ─────────────────
  const STATUS_PAGES = ['/auth/pending', '/auth/rejected', '/auth/suspended']
  const isStatusPage = STATUS_PAGES.some(p => pathname.startsWith(p))

  if (user && !isStatusPage && !pathname.startsWith('/api/') && !pathname.startsWith('/tripo')) {
    if (profile?.role !== 'admin') {
      const status = profile?.status ?? 'pending'
      if (status === 'pending')   return NextResponse.redirect(new URL('/auth/pending',   request.url))
      if (status === 'rejected')  return NextResponse.redirect(new URL('/auth/rejected',  request.url))
      if (status === 'suspended') return NextResponse.redirect(new URL('/auth/suspended', request.url))
    }
  }

  if (user && pathname.startsWith('/dashboard')) {
    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/tripo/dashboard', request.url))
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
  if (pathname.startsWith('/tripo/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/tripo/login', request.url))
    }

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
      return NextResponse.redirect(new URL('/tripo/mfa-challenge', request.url))
    }
    if (aal?.nextLevel === 'aal1' && aal?.currentLevel === 'aal1') {
      return NextResponse.redirect(new URL('/tripo/mfa-setup', request.url))
    }
  }

  // Redirect authenticated admin trying to re-login
  if (user && pathname === '/tripo/login') {
    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/tripo/dashboard', request.url))
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
