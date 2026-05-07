export function isSafeDziSource(urlString: string): boolean {
  const t = urlString.trim()
  if (!t) return false
  if (t.startsWith('/')) return !t.includes('..')
  return isAllowedAssetUrl(t)
}

export function isAllowedAssetUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    if (u.protocol === 'http:' && process.env.NODE_ENV === 'production') return false

    const host = u.hostname.toLowerCase()

    if (process.env.NODE_ENV !== 'production') {
      if (host === 'localhost' || host === '127.0.0.1') return true
    }

    const extra = (process.env.NEXT_PUBLIC_ALLOWED_ASSET_HOSTS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    for (const h of extra) {
      if (host === h || host.endsWith('.' + h)) return true
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      try {
        if (host === new URL(supabaseUrl).hostname) return true
      } catch {
        /* ignore */
      }
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL
    if (site) {
      try {
        if (host === new URL(site).hostname) return true
      } catch {
        /* ignore */
      }
    }

    if (host.endsWith('.r2.cloudflarestorage.com')) return true
    if (host.endsWith('.r2.dev')) return true

    return false
  } catch {
    return false
  }
}
