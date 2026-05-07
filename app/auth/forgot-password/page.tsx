import { resetPassword } from '@/lib/actions/auth'
import Link from 'next/link'
import { ValidatedInput } from '@/components/ui/FormElements'
import { getDictionary } from '@/lib/dictionary'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : null
  const success = typeof searchParams.success === 'string' ? searchParams.success : null

  const ERROR_MAP: Record<string, string> = {
    reset_failed: "Si è verificato un errore.",
    default: "Si è verificato un errore.",
  }
  const errorMessage = errorCode ? ERROR_MAP[errorCode] || ERROR_MAP.default : null

  const dict = await getDictionary()
  const t = dict.auth.forgotPassword
  const tf = dict.auth.form

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-3xl text-gray-900 mb-2">{t.successTitle}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t.successDesc}
          </p>
          <Link href="/auth/login" className="text-sm font-bold text-black hover:underline">
            {t.backToLogin}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in zoom-in-95">
        <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.backToLogin}
        </Link>

        <h2 className="font-serif text-3xl text-gray-900 mb-2">{t.heading}</h2>
        <p className="text-sm text-gray-600 mb-8">{t.subheading}</p>

        {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
        )}

        <form className="space-y-6">
          <ValidatedInput 
            name="email" 
            type="email" 
            label={tf.labels.emailSimple}
            required 
          />
          <button formAction={resetPassword} className="btn-elegant w-full py-3.5">
            {t.btn}
          </button>
        </form>
      </div>
    </div>
  )
}