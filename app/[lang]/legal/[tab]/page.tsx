import { LegalContent } from '@/components/legal/LegalContent'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getDictionaryForLocale } from '@/lib/dictionary'
import { LOCALES, DEFAULT_LOCALE } from '@/lib/constants'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

const VALID_TABS = ['privacy', 'terms', 'cookie', 'dpa'] as const
type Tab = typeof VALID_TABS[number]

export function generateStaticParams() {
  return LOCALES.flatMap(({ code }) =>
    VALID_TABS.map(tab => ({ lang: code, tab }))
  )
}

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string; tab: string }> }
): Promise<Metadata> {
  const { lang, tab } = await params
  const locale = LOCALES.find(l => l.code === lang) ? lang : DEFAULT_LOCALE
  const dict = getDictionaryForLocale(locale as any)
  const tabLabels: Record<string, string> = {
    privacy: dict.legal.tabs.privacy,
    terms: dict.legal.tabs.terms,
    cookie: dict.legal.tabs.cookie,
    dpa: dict.legal.tabs.dpa,
  }
  return {
    title: `${tabLabels[tab] ?? dict.legal.title} — Histyon`,
  }
}

export default async function LegalTabPage(
  { params }: { params: Promise<{ lang: string; tab: string }> }
) {
  const { lang, tab } = await params

  const locale = LOCALES.find(l => l.code === lang) ? lang : DEFAULT_LOCALE
  if (!VALID_TABS.includes(tab as Tab)) redirect(`/${locale}/legal/privacy`)

  const dict = getDictionaryForLocale(locale as any)

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      <Header variant="public" />
      <LegalContent dict={dict} tab={tab as any} />
      <Footer />
    </div>
  )
}
