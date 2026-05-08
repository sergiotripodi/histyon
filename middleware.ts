import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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