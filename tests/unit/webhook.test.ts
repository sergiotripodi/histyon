import { describe, it, expect } from 'vitest'

// ── UUID validation (mirrors app/api/webhook/job-complete/route.ts) ───────────
const TICKET_UUID_RE = /^[0-9a-f-]{36}$/i

describe('ticketId UUID validation', () => {
  it('accepts a valid v4 UUID', () => {
    expect(TICKET_UUID_RE.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('accepts uppercase UUID', () => {
    expect(TICKET_UUID_RE.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(TICKET_UUID_RE.test('')).toBe(false)
  })

  it('rejects a short string', () => {
    expect(TICKET_UUID_RE.test('abc-123')).toBe(false)
  })

  it('rejects a string with non-hex characters', () => {
    expect(TICKET_UUID_RE.test('550e8400-e29b-41d4-a716-44665544000g')).toBe(false)
  })

  it('rejects path traversal attempt', () => {
    expect(TICKET_UUID_RE.test('../etc/passwd')).toBe(false)
  })

  it('rejects SQL injection', () => {
    expect(TICKET_UUID_RE.test("'; DROP TABLE tickets;--")).toBe(false)
  })
})

// ── Status normalization (mirrors app/api/webhook/job-complete/route.ts) ─────
function normalizeStatus(status: string): string | null {
  const normalized = ['FAILED_ANALYSIS', 'FAILED', 'FAIL'].includes(status) ? 'ERROR' : status
  return ['COMPLETED', 'ERROR', 'PROCESSING'].includes(normalized) ? normalized : null
}

describe('ticket status normalization', () => {
  it('normalizes FAILED → ERROR', () => {
    expect(normalizeStatus('FAILED')).toBe('ERROR')
  })

  it('normalizes FAILED_ANALYSIS → ERROR', () => {
    expect(normalizeStatus('FAILED_ANALYSIS')).toBe('ERROR')
  })

  it('normalizes FAIL → ERROR', () => {
    expect(normalizeStatus('FAIL')).toBe('ERROR')
  })

  it('passes COMPLETED through unchanged', () => {
    expect(normalizeStatus('COMPLETED')).toBe('COMPLETED')
  })

  it('passes PROCESSING through unchanged', () => {
    expect(normalizeStatus('PROCESSING')).toBe('PROCESSING')
  })

  it('returns null for unknown statuses', () => {
    expect(normalizeStatus('UNKNOWN')).toBeNull()
    expect(normalizeStatus('QUEUED')).toBeNull()  // QUEUED is not a valid update target
    expect(normalizeStatus('')).toBeNull()
  })
})

// ── Path traversal guard (mirrors app/api/tiles/[ticketId]/[...path]/route.ts)
const SAFE_PATH_RE = /^[\w.\-/]+$/

function isValidTilePath(filePath: string): boolean {
  return (
    !filePath.startsWith('/') &&
    !filePath.includes('..') &&
    !filePath.includes('\x00') &&
    !filePath.includes('%') &&
    SAFE_PATH_RE.test(filePath)
  )
}

describe('tile path validation', () => {
  it('accepts a normal DZI path', () => {
    expect(isValidTilePath('slide.dzi')).toBe(true)
    expect(isValidTilePath('slide_files/10/3_4.jpg')).toBe(true)
  })

  it('rejects path traversal with ..', () => {
    expect(isValidTilePath('../../../etc/passwd')).toBe(false)
    expect(isValidTilePath('slide/../../../secret')).toBe(false)
  })

  it('rejects null byte injection', () => {
    expect(isValidTilePath('slide\x00.dzi')).toBe(false)
  })

  it('rejects URL-encoded traversal', () => {
    expect(isValidTilePath('slide%2F..%2Fetc')).toBe(false)
  })

  it('rejects absolute paths', () => {
    expect(isValidTilePath('/etc/passwd')).toBe(false)
  })
})
