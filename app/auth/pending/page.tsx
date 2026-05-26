import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { signout }      from '@/lib/actions/auth'
import { Clock }        from 'lucide-react'

export const metadata = { title: 'Account in attesa — Histyon' }

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full border border-gray-200 bg-white p-12">

        <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-8">
          <Clock className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
        </div>

        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-4">Histyon</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
          Account in attesa di approvazione
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          La tua registrazione è stata ricevuta. Il team Histyon sta verificando le tue credenziali mediche e ti risponderà <strong className="text-gray-700">entro 24 ore</strong>.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-10">
          Riceverai una email all'indirizzo <strong className="text-gray-700">{user.email}</strong> con l'esito della verifica.
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
