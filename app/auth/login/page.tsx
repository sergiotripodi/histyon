import { login } from '../../../lib/actions/auth'
import Link from 'next/link'
import { AuthSidebar } from '@/components/auth/AuthSidebar'
import { AlertCircle, CheckCircle2, UserPlus, ArrowRight } from 'lucide-react'
import { ValidatedInput } from '@/components/ui/FormElements'
import { getDictionary } from '@/lib/dictionary'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary()
  return {
    title: dict.auth.login.title,
  }
}

export default async function LoginPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams

  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : null
  const successCode = typeof searchParams.success === 'string' ? searchParams.success : null

  const dict = await getDictionary()
  const t = dict.auth.login

  const ERROR_MAP: Record<string, string> = {
    invalid_credentials: t.errorInvalidCredentials,
    oauth_failed: t.errorGeneric,
    account_locked: t.errorAccountLocked,
    unverified: t.errorUnverified,
    default: t.errorGeneric,
  }
  const SUCCESS_MAP: Record<string, string> = {
    registered: t.successRegistered,
    password_reset: t.successPasswordReset,
  }

  const errorMessage = errorCode ? (ERROR_MAP[errorCode] ?? ERROR_MAP.default) : null
  const successMessage = successCode ? (SUCCESS_MAP[successCode] ?? null) : null
  const tf = dict.auth.form

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      
      <AuthSidebar dict={dict} />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t.heading}</h1>
            <p className="text-gray-500">{t.subheading}</p>
          </div>

          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          <form className="space-y-5" noValidate>
            <ValidatedInput 
                name="email" 
                type="email" 
                label={tf.labels.emailSimple}
                required 
            />
            
            <div className="space-y-1">
                <ValidatedInput 
                    name="password" 
                    type="password" 
                    label={tf.labels.passwordSimple}
                    required 
                />
                <div className="flex justify-end">
                    <Link 
                        href="/auth/forgot-password" 
                        className="text-xs font-semibold text-gray-500 hover:text-black transition-colors"
                    >
                        {t.forgotPassword}
                    </Link>
                </div>
            </div>
            
            <button formAction={login} className="btn-elegant w-full py-3.5 mt-4">
              {t.btn}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-4">{t.noCredentials}</p>
            <Link href="/auth/register" className="group flex items-center justify-between p-5 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                        <UserPlus className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900 text-sm">{t.requestAccess}</p>
                        <p className="text-xs text-gray-500">{t.medicalProfile}</p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}