import { resetPassword } from '@/lib/actions/auth'
import Link from 'next/link'
import { ValidatedInput } from '@/components/ui/FormElements'
import { getDictionary } from '@/lib/dictionary'
import { ArrowLeft, MailCheck, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Password dimenticata' }

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : null
  const success = typeof searchParams.success === 'string' ? searchParams.success : null

  const dict = await getDictionary()
  const t = dict.auth.forgotPassword
  const tf = dict.auth.form

  const ERROR_MAP: Record<string, string> = {
    reset_failed: t.errorGeneric ?? 'Si è verificato un errore.',
    default: t.errorGeneric ?? 'Si è verificato un errore.',
  }
  const errorMessage = errorCode ? ERROR_MAP[errorCode] || ERROR_MAP.default : null

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md w-full border border-gray-200 bg-white p-12">
          <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-8">
            <MailCheck className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-4">Histyon</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">{t.successTitle}</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-10">{t.successDesc}</p>
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full border border-gray-200 bg-white p-12">
        <Link href="/auth/login" className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-black mb-10 transition-colors tracking-wide uppercase">
          <ArrowLeft className="w-3 h-3 mr-2" /> {t.backToLogin}
        </Link>

        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-4">Histyon</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">{t.heading}</h1>
        <p className="text-sm text-gray-500 mb-8">{t.subheading}</p>

        {errorMessage && (
          <div className="mb-6 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
