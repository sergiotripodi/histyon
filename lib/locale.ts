import { DEFAULT_LOCALE, LOCALES } from '@/lib/constants'

const SUPPORTED = new Set<string>(LOCALES.map((l) => l.code))

/**
 * Picks the first supported language tag from the Accept-Language header.
 */
export function localeFromAcceptLanguage(acceptLanguage: string | null | undefined): string {
  if (!acceptLanguage || !acceptLanguage.trim()) return DEFAULT_LOCALE

  const parts = acceptLanguage.split(',')
  for (const part of parts) {
    const tag = part.split(';')[0]?.trim().toLowerCase()
    if (!tag) continue
    const primary = tag.slice(0, 2)
    if (primary && SUPPORTED.has(primary)) return primary
  }
  return DEFAULT_LOCALE
}
