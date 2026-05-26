import { getDictionary } from '@/lib/dictionary'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { UpdatePasswordForm } from './UpdatePasswordForm'

export const metadata = { title: 'Nuova password' }

export default async function UpdatePasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : null
  const success   = typeof searchParams.success === 'string' ? searchParams.success : null

  const dict = await getDictionary()
  const t = dict.auth.updatePassword

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md w-full border border-gray-200 bg-white p-12">
          <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-8">
            <ShieldCheck className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-4">Histyon</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">{t.successTitle}</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-10">{t.success}</p>
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

  const ERROR_MAP: Record<string, string> = {
    password_mismatch: t.errorMatch,
    password_weak: t.errorWeak,
    password_same: t.errorSame,
    password_update_failed: t.errorUpdateFailed,
    default: t.errorDefault,
  }
  const errorMessage = errorCode ? (ERROR_MAP[errorCode] ?? ERROR_MAP.default) : null
  const tf = dict.auth.form

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full border border-gray-200 bg-white p-12">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-4">Histyon</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">{t.heading}</h1>
        <p className="text-sm text-gray-500 mb-8">{t.subheading}</p>

        {errorMessage && (
          <div className="mb-6 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <UpdatePasswordForm
          passwordLabel={tf.labels.passwordSimple}
          confirmLabel={tf.labels.confirmPassword}
          btnLabel={t.btn}
        />
      </div>
    </div>
  )
}
