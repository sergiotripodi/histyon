/**
 * Distributed rate limiting via Vercel KV (Upstash Redis).
 * Falls back to in-memory Maps when KV_REST_API_URL is not set (local dev).
 *
 * Production setup:
 *   1. Vercel dashboard → Storage → Create KV database → Connect to this project
 *   2. Vercel auto-injects KV_REST_API_URL and KV_REST_API_TOKEN env vars
 *   3. No code changes required — the KV branch activates automatically
 */

// ── In-memory fallback (dev / when KV not configured) ─────────────────────────

const _memMap = new Map<string, { count: number; resetAt: number }>()

function memCheck(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = _memMap.get(key)
  if (!entry || now > entry.resetAt) {
    _memMap.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count++
  return entry.count > limit
}

// ── KV-backed check ───────────────────────────────────────────────────────────

async function kvCheck(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { kv } = await import('@vercel/kv')
  const pipeline = kv.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, windowSeconds, 'NX') // NX = set expiry only on first write
  const [count] = await pipeline.exec() as [number, number]
  return count > limit
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function isRateLimited(
  ip: string,
  route: 'login' | 'signup' | 'admin-login',
): Promise<boolean> {
  const configs = {
    'login':       { limit: 10, windowMs: 15 * 60 * 1000, windowSec: 15 * 60 },
    'signup':      { limit: 5,  windowMs: 60 * 60 * 1000, windowSec: 60 * 60 },
    'admin-login': { limit: 5,  windowMs: 15 * 60 * 1000, windowSec: 15 * 60 },
  }
  const { limit, windowMs, windowSec } = configs[route]
  const key = `rl:${route}:${ip}`

  if (process.env.KV_REST_API_URL) {
    try {
      return await kvCheck(key, limit, windowSec)
    } catch {
      // KV unavailable — degrade gracefully to in-memory
    }
  }
  return memCheck(key, limit, windowMs)
}
