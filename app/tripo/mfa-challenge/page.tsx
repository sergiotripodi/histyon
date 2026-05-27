import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminMfaChallengeLoader } from '@/components/admin/AdminMfaChallengeLoader'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Verifica 2FA' }

const steps = [
  {
    title: "Apri l'app di autenticazione",
    desc: 'Apri Google Authenticator o Authy sul tuo smartphone.',
  },
  {
    title: 'Trova il codice Histyon Admin',
    desc: 'Nell\'elenco degli account trovi "Histyon Admin". Vedrai un codice a 6 cifre che si aggiorna ogni 30 secondi.',
  },
  {
    title: 'Inserisci il codice',
    desc: 'Digita il codice nel campo qui a sinistra prima che scada. Se scade mentre scrivi, aspetta il codice successivo.',
  },
]

export default async function AdminMfaChallengePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/tripo/login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-4xl w-full flex flex-col sm:flex-row">

        {/* Left box — form */}
        <div className="flex-1 min-w-0 border border-gray-200 bg-white p-8 lg:p-10">
          <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-7">
            <ShieldCheck className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          </div>

          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
            Console — Verifica in due passaggi
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            Conferma la tua identità.
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Inserisci il codice a 6 cifre generato dalla tua app di autenticazione per accedere alla console amministrativa.
          </p>

          <AdminMfaChallengeLoader />
        </div>

        {/* Right box — guide */}
        <div className="flex-1 min-w-0 border border-gray-200 border-t-0 sm:border-t sm:border-l-0 bg-gray-50 p-8 lg:p-10 space-y-8">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-1">Come accedere</p>
            <h2 className="text-lg font-bold text-gray-900">Dove trovo il codice?</h2>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">
              Il codice si trova nell'app di autenticazione configurata al momento della prima attivazione. Non serve nessun SMS — il codice è generato dall'app, anche senza connessione internet.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="shrink-0 w-7 h-7 bg-gray-900 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-3">Codice scaduto?</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Il codice cambia ogni 30 secondi. Se scade mentre lo digiti, aspetta che l'app generi quello nuovo e inseriscilo. Non è necessario ricaricare la pagina.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Accesso riservato. Solo personale autorizzato.{' '}
              <span className="font-medium text-gray-600">info@histyon.com</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
