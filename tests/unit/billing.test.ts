import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPeriodMs, BILLING_DAY, RESEND_RESET_DAY } from '@/lib/billing/config'

afterEach(() => vi.useRealTimers())

describe('getPeriodMs — explicit monthStr', () => {
  it('standard mid-year cycle', () => {
    const { startMs, endMs } = getPeriodMs(24, '2026-05')
    expect(new Date(startMs).toISOString()).toBe('2026-05-24T00:00:00.000Z')
    expect(new Date(endMs).toISOString()).toBe('2026-06-24T00:00:00.000Z')
  })

  it('year-boundary rollover (December → January)', () => {
    const { startMs, endMs } = getPeriodMs(24, '2026-12')
    expect(new Date(startMs).toISOString()).toBe('2026-12-24T00:00:00.000Z')
    expect(new Date(endMs).toISOString()).toBe('2027-01-24T00:00:00.000Z')
  })

  it('February short month', () => {
    const { startMs, endMs } = getPeriodMs(1, '2026-02')
    expect(new Date(startMs).toISOString()).toBe('2026-02-01T00:00:00.000Z')
    expect(new Date(endMs).toISOString()).toBe('2026-03-01T00:00:00.000Z')
  })

  it('endMs is strictly after startMs', () => {
    const { startMs, endMs } = getPeriodMs(15, '2026-07')
    expect(endMs).toBeGreaterThan(startMs)
  })

  it('span is between 28 and 31 days', () => {
    const { startMs, endMs } = getPeriodMs(24, '2026-02')
    const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThanOrEqual(28)
    expect(diffDays).toBeLessThanOrEqual(31)
  })
})

describe('getPeriodMs — auto-detect from current date', () => {
  it('uses previous month when today is before resetDay', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T12:00:00.000Z')) // day 20 < resetDay 24
    const { startMs, endMs } = getPeriodMs(24)
    expect(new Date(startMs).toISOString()).toBe('2026-04-24T00:00:00.000Z')
    expect(new Date(endMs).toISOString()).toBe('2026-05-24T00:00:00.000Z')
  })

  it('uses current month when today is on resetDay', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-24T00:00:00.000Z')) // exactly resetDay
    const { startMs, endMs } = getPeriodMs(24)
    expect(new Date(startMs).toISOString()).toBe('2026-05-24T00:00:00.000Z')
    expect(new Date(endMs).toISOString()).toBe('2026-06-24T00:00:00.000Z')
  })

  it('uses current month when today is after resetDay', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-28T12:00:00.000Z')) // day 28 > resetDay 24
    const { startMs, endMs } = getPeriodMs(24)
    expect(new Date(startMs).toISOString()).toBe('2026-05-24T00:00:00.000Z')
    expect(new Date(endMs).toISOString()).toBe('2026-06-24T00:00:00.000Z')
  })

  it('handles January (previous month = December prev year)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z')) // day 10 < resetDay 24
    const { startMs } = getPeriodMs(24)
    expect(new Date(startMs).toISOString()).toBe('2025-12-24T00:00:00.000Z')
  })
})

describe('BILLING_DAY and RESEND_RESET_DAY are valid calendar days', () => {
  it('BILLING_DAY is in [1,28]', () => {
    expect(BILLING_DAY).toBeGreaterThanOrEqual(1)
    expect(BILLING_DAY).toBeLessThanOrEqual(28)
  })

  it('RESEND_RESET_DAY is in [1,28]', () => {
    expect(RESEND_RESET_DAY).toBeGreaterThanOrEqual(1)
    expect(RESEND_RESET_DAY).toBeLessThanOrEqual(28)
  })
})
