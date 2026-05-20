import { updatePassword } from '@/lib/actions/auth'
import { ValidatedInput } from '@/components/ui/FormElements'
import { getDictionary } from '@/lib/dictionary'
import { AlertCircle } from 'lucide-react'

export const metadata = { title: 'Nuova password' }

export default async function UpdatePasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : null

  const dict = await getDictionary()
  const t = dict.auth.updatePassword

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

        <form className="space-y-6">
          <ValidatedInput
            name="password"
            type="password"
            label={tf.labels.passwordSimple}
            required
          />
          <ValidatedInput
            name="confirmPassword"
            type="password"
            label={tf.labels.confirmPassword}
            required
          />
          <button formAction={updatePassword} className="btn-elegant w-full py-3.5">
            {t.btn}
          </button>
        </form>
      </div>
    </div>
  )
}
