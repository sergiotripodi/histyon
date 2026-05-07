import { redirect } from 'next/navigation'
import { getLocale } from '@/lib/dictionary'

export default async function LegalPage() {
  const lang = await getLocale()
  redirect(`/${lang}/legal/privacy`)
}