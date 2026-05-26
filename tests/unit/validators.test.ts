import { describe, it, expect } from 'vitest'
import { REGEX_VALIDATORS, ALLOWED_SLIDE_EXTENSIONS, MAX_UPLOAD_BYTES } from '@/lib/constants'

// ── NAME ─────────────────────────────────────────────────────────────────────
describe('REGEX_VALIDATORS.NAME', () => {
  const re = new RegExp(REGEX_VALIDATORS.NAME)

  it('accepts ASCII-only names', () => {
    expect(re.test('Mario')).toBe(true)
    expect(re.test('Rossi Bianchi')).toBe(true)
  })

  it('accepts accented Italian / European characters', () => {
    expect(re.test('Giò')).toBe(true)
    expect(re.test('André')).toBe(true)
    expect(re.test('Müller')).toBe(true)
    expect(re.test('Søren')).toBe(true)
    expect(re.test('Ñoño')).toBe(true)
  })

  it('accepts apostrophes and hyphens in names', () => {
    expect(re.test("O'Brien")).toBe(true)
    expect(re.test('Jean-Pierre')).toBe(true)
  })

  it('rejects names with digits', () => {
    expect(re.test('Mario1')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(re.test('')).toBe(false)
  })

  it('rejects SQL injection payloads', () => {
    expect(re.test("'; DROP TABLE users;--")).toBe(false)
    expect(re.test('1 OR 1=1')).toBe(false)
  })

  it('rejects HTML/XSS payloads', () => {
    expect(re.test('<script>alert(1)</script>')).toBe(false)
    expect(re.test('"><img src=x>')).toBe(false)
  })
})

// ── FISCAL_CODE ───────────────────────────────────────────────────────────────
describe('REGEX_VALIDATORS.FISCAL_CODE', () => {
  const re = new RegExp(REGEX_VALIDATORS.FISCAL_CODE)

  it('accepts valid 16-char alphanumeric codes', () => {
    expect(re.test('RSSMRA85M01H501Z')).toBe(true)
    expect(re.test('BNCMRC90A01F205X')).toBe(true)
  })

  it('rejects codes shorter than 16 chars', () => {
    expect(re.test('RSSMRA85M01H501')).toBe(false)
  })

  it('rejects codes longer than 16 chars', () => {
    expect(re.test('RSSMRA85M01H501ZZ')).toBe(false)
  })

  it('rejects codes with special characters', () => {
    expect(re.test('RSSMRA85M01H501!')).toBe(false)
    expect(re.test('RSSMRA85M01H501 ')).toBe(false)
  })
})

// ── EMAIL ─────────────────────────────────────────────────────────────────────
describe('REGEX_VALIDATORS.EMAIL', () => {
  const re = new RegExp(REGEX_VALIDATORS.EMAIL)

  it('accepts valid emails', () => {
    expect(re.test('user@example.com')).toBe(true)
    expect(re.test('user.name+tag@sub.domain.io')).toBe(true)
    expect(re.test('doc@hospital.it')).toBe(true)
  })

  it('rejects emails without @', () => {
    expect(re.test('notanemail')).toBe(false)
  })

  it('rejects emails starting with @', () => {
    expect(re.test('@domain.com')).toBe(false)
  })

  it('rejects emails with no TLD', () => {
    expect(re.test('user@domain')).toBe(false)
  })
})

// ── PHONE ─────────────────────────────────────────────────────────────────────
describe('REGEX_VALIDATORS.PHONE', () => {
  const re = new RegExp(REGEX_VALIDATORS.PHONE)

  it('accepts digit-only strings', () => {
    expect(re.test('3331234567')).toBe(true)
  })

  it('accepts digits with spaces', () => {
    expect(re.test('333 123 4567')).toBe(true)
  })

  it('rejects letters', () => {
    expect(re.test('123abc')).toBe(false)
  })

  it('rejects symbols other than spaces', () => {
    expect(re.test('+39333')).toBe(false) // + is not allowed (prefix is handled separately)
  })
})

// ── ALLOWED_SLIDE_EXTENSIONS ─────────────────────────────────────────────────
describe('ALLOWED_SLIDE_EXTENSIONS', () => {
  it('contains svs and ndpi', () => {
    expect(ALLOWED_SLIDE_EXTENSIONS).toContain('svs')
    expect(ALLOWED_SLIDE_EXTENSIONS).toContain('ndpi')
  })

  it('all extensions are lowercase', () => {
    for (const ext of ALLOWED_SLIDE_EXTENSIONS) {
      expect(ext).toBe(ext.toLowerCase())
    }
  })
})

// ── MAX_UPLOAD_BYTES ──────────────────────────────────────────────────────────
describe('MAX_UPLOAD_BYTES', () => {
  it('is exactly 5 GB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024 * 1024)
  })
})
