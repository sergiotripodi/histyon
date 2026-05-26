import { describe, it, expect } from 'vitest'
import { isRateLimited } from '@/lib/rate-limit'

// Each test uses a unique IP so the module-level Map doesn't bleed between tests.
let seq = 0
const ip = () => `10.${Math.floor(seq / 65536)}.${Math.floor((seq % 65536) / 256)}.${(seq++ % 256)}`

describe('isRateLimited — in-memory (no KV_REST_API_URL set)', () => {
  it('allows every request below the login limit (10)', async () => {
    const testIp = ip()
    for (let i = 0; i < 10; i++) {
      expect(await isRateLimited(testIp, 'login')).toBe(false)
    }
  })

  it('blocks on the 11th login attempt', async () => {
    const testIp = ip()
    for (let i = 0; i < 10; i++) await isRateLimited(testIp, 'login')
    expect(await isRateLimited(testIp, 'login')).toBe(true)
  })

  it('allows every request below the signup limit (5)', async () => {
    const testIp = ip()
    for (let i = 0; i < 5; i++) {
      expect(await isRateLimited(testIp, 'signup')).toBe(false)
    }
  })

  it('blocks on the 6th signup attempt', async () => {
    const testIp = ip()
    for (let i = 0; i < 5; i++) await isRateLimited(testIp, 'signup')
    expect(await isRateLimited(testIp, 'signup')).toBe(true)
  })

  it('blocks on the 6th admin-login attempt', async () => {
    const testIp = ip()
    for (let i = 0; i < 5; i++) await isRateLimited(testIp, 'admin-login')
    expect(await isRateLimited(testIp, 'admin-login')).toBe(true)
  })

  it('different IPs are fully independent', async () => {
    const ip1 = ip()
    const ip2 = ip()
    for (let i = 0; i < 10; i++) await isRateLimited(ip1, 'login')
    // ip1 is exhausted; ip2 starts fresh
    expect(await isRateLimited(ip2, 'login')).toBe(false)
  })

  it('different routes share no counters for the same IP', async () => {
    const testIp = ip()
    for (let i = 0; i < 10; i++) await isRateLimited(testIp, 'login')
    // login exhausted but signup is independent
    expect(await isRateLimited(testIp, 'signup')).toBe(false)
    expect(await isRateLimited(testIp, 'admin-login')).toBe(false)
  })
})
