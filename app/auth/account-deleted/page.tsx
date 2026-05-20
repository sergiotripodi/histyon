import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { getDictionary } from '@/lib/dictionary'

export const metadata = { title: 'Account eliminato' }

export default async function AccountDeletedPage() {
  const dict = await getDictionary()
  const t = dict.auth.deleted

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">

        <div className="mb-12">
          <Logo color="black" />
        </div>

        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-4">
          Histyon Console
        </p>

        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
          {t.heading}
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          {t.subheading}
        </p>

        <div className="border-l-4 border-gray-200 pl-5 mb-10">
          <p className="text-sm text-gray-500 leading-relaxed">
            {t.message}
          </p>
        </div>

        <Link href="/" className="btn-elegant inline-flex items-center gap-2 px-6 py-3">
          {t.homeBtn}
        </Link>

      </div>
    </div>
  )
}
