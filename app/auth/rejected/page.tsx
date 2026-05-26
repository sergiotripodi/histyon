import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { signout }      from '@/lib/actions/auth'
import { XCircle }      from 'lucide-react'

export const metadata = { title: 'Accesso non approvato — Histyon' }

export default async function RejectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('status_reason, deletion_scheduled_at, first_name, last_name')
    .eq('id', user.id)
    .single()

  const deletionDate = profile?.deletion_scheduled_at
    ? new Date(profile.deletion_scheduled_at).toLocaleDateString('it-IT', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full border border-gray-200 bg-white p-12">

        <div className="w-10 h-10 border border-red-200 flex items-center justify-center mb-8">
          <XCircle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
        </div>

        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-4">Histyon</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
          Richiesta di accesso non approvata
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Dopo aver esaminato la tua richiesta, il team Histyon non ha potuto approvare il tuo account.
        </p>

        {profile?.status_reason && (
          <div className="border-l-2 border-red-300 bg-red-50 px-4 py-3 mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400 mb-1">Motivo</p>
            <p className="text-sm text-red-700">{profile.status_reason}</p>
          </div>
        )}

        {deletionDate && (
          <p className="text-sm text-gray-400 mb-10">
            Il tuo account verrà eliminato automaticamente il <strong className="text-gray-600">{deletionDate}</strong>.
          </p>
        )}

        <p className="text-xs text-gray-400 mb-10">
          Per chiarimenti scrivi a{' '}
          <a href="mailto:info@histyon.com" className="text-gray-600 hover:text-gray-900 font-medium">
            info@histyon.com
          </a>
        </p>

        <form action={signout}>
          <button
            type="submit"
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors uppercase tracking-widest"
          >
            Esci
          </button>
        </form>

      </div>
    </div>
  )
}
