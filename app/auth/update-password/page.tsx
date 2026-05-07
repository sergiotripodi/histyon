import { updatePassword } from '@/lib/actions/auth'
import { ValidatedInput } from '@/components/ui/FormElements'
import { getDictionary } from '@/lib/dictionary'
import { AlertCircle } from 'lucide-react'

export default async function UpdatePasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : null

  const ERROR_MAP: Record<string, string> = {
    password_mismatch: "Le password non coincidono.",
    password_update_failed: "Impossibile aggiornare la password. Riprova.",
    default: "Si è verificato un errore.",
  }
  const errorMessage = errorCode ? ERROR_MAP[errorCode] || ERROR_MAP.default : null

  const dict = await getDictionary()
  const t = dict.auth.updatePassword
  const tf = dict.auth.form

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in zoom-in-95">
        
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