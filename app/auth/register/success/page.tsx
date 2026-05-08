import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { getDictionary } from '@/lib/dictionary'

export default async function RegisterSuccessPage() {
  const dict = await getDictionary()
  const t = dict.auth.register.success

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full border border-gray-200 bg-white p-12">
        <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-8">
          <MailCheck className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
        </div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-4">Histyon</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">{t.title}</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">{t.desc}</p>
        <p className="text-sm text-gray-400 leading-relaxed mb-10">{t.spamNotice}</p>
        <Link
          href="/auth/login"
          className="btn-elegant inline-flex items-center justify-center w-full py-3.5"
        >
          {t.backToLogin}
        </Link>
      </div>
    </div>
  )
}
