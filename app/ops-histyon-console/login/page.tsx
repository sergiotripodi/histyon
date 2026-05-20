import { AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export const metadata = { title: 'Accesso Admin' }

export default async function AdminLoginPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const errorCode = typeof searchParams.error === 'string' ? searchParams.error : null

  const ERROR_MAP: Record<string, string> = {
    invalid_credentials: 'Credenziali non valide.',
    default: 'Si è verificato un errore. Riprova.',
  }
  const errorMessage = errorCode ? (ERROR_MAP[errorCode] ?? ERROR_MAP.default) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-10">
          <Logo color="black" className="[&_img]:h-6" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Accesso amministratore</h1>
        <p className="text-sm text-gray-400 mb-8">Accesso riservato. Autenticazione a due fattori richiesta.</p>

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <AdminLoginForm />

        <p className="mt-8 text-[11px] text-gray-300 text-center">
          Accesso monitorato. Solo personale autorizzato.
        </p>
      </div>
    </div>
  )
}
