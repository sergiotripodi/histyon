import { redirect } from 'next/navigation'
import { getLocale } from '@/lib/dictionary'

export default async function LegalTabRedirectPage(
  { params }: { params: Promise<{ tab: string }> }
) {
  const [lang, { tab }] = await Promise.all([getLocale(), params])
  redirect(`/${lang}/legal/${tab}`)
}
