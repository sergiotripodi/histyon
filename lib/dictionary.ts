import 'server-only'
import { headers } from 'next/headers'
import { DEFAULT_LOCALE } from '@/lib/constants'
import { localeFromAcceptLanguage } from '@/lib/locale'
import { it } from './dictionaries/it'
import { en } from './dictionaries/en'

const dictionaries = {
  it,
  en,
}

export type Dictionary = typeof en;

export type Locale = keyof typeof dictionaries
export const defaultLocale: Locale = DEFAULT_LOCALE as Locale

export async function getLocale(): Promise<Locale> {
  const headersList = await headers()
  const code = localeFromAcceptLanguage(headersList.get('accept-language'))
  return (dictionaries[code as Locale] ? code : DEFAULT_LOCALE) as Locale
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale()
  return dictionaries[locale] as unknown as Dictionary
}

export function getDictionaryForLocale(locale: Locale): Dictionary {
  return (dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]) as unknown as Dictionary
}

export const dictionary = en;