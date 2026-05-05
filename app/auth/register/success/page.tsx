import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { getDictionary } from '@/lib/dictionary'

export default async function RegisterSuccessPage() {
  const dict = await getDictionary()
  const t = dict.auth.register.success

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck className="w-8 h-8 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {t.desc}
        </p>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 text-sm text-gray-500">
          {t.spamNotice}
        </div>

        <Link 
          href="/auth/login" 
          className="inline-flex items-center justify-center w-full px-4 py-3.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-all shadow-lg"
        >
          {t.backToLogin}
        </Link>
      </div>
    </div>
  )
}