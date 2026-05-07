import { redirect } from 'next/navigation'
import { LOCALES, DEFAULT_LOCALE } from '@/lib/constants'

export function generateStaticParams() {
  return LOCALES.map(({ code }) => ({ lang: code }))
}

export default async function LegalLangPage(
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params
  const locale = LOCALES.find(l => l.code === lang) ? lang : DEFAULT_LOCALE
  redirect(`/${locale}/legal/privacy`)
}
