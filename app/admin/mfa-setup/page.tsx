import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminMfaSetupLoader } from '@/components/admin/AdminMfaSetupLoader'
import { Shield } from 'lucide-react'

export const metadata = { title: 'Configura 2FA' }

const steps = [
  {
    title: "Installa un'app di autenticazione",
    desc: "Scarica gratuitamente Google Authenticator oppure Authy sul tuo smartphone. Disponibili su App Store e Google Play.",
  },
  {
    title: 'Scansiona il codice QR',
    desc: 'Apri l\'app, premi "+" e scegli "Scansiona codice QR". Punta la fotocamera al riquadro qui a sinistra: l\'account "Histyon Admin" apparirà in automatico.',
  },
  {
    title: 'Inserisci il codice a 6 cifre',
    desc: "Nell'app comparirà un numero di 6 cifre che cambia ogni 30 secondi. Inseriscilo nel campo qui a sinistra e premi \"Conferma\".",
  },
]

export default async function AdminMfaSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-4xl w-full flex flex-col sm:flex-row">

        {/* Left box — form */}
        <div className="flex-1 min-w-0 border border-gray-200 bg-white p-8 lg:p-10">
          <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-7">
            <Shield className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          </div>

          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
            Console — Verifica in due passaggi
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            Configura il 2FA.
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            L'accesso alla console amministrativa richiede l'autenticazione a due fattori. Scansiona il QR code con la tua app e inserisci il codice per attivare la protezione.
          </p>

          <AdminMfaSetupLoader />
        </div>

        {/* Right box — guide */}
        <div className="flex-1 min-w-0 border border-gray-200 border-t-0 sm:border-t sm:border-l-0 bg-gray-50 p-8 lg:p-10 space-y-8">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-1">Come funziona</p>
            <h2 className="text-lg font-bold text-gray-900">Tre passi per iniziare</h2>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">
              Il 2FA aggiunge un secondo livello di protezione all'accesso admin. Oltre alla password, verrà richiesto un codice temporaneo dall'app — così nessuno potrà accedere anche conoscendo le credenziali.
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

          <div className="pt-6 border-t border-gray-200 space-y-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em]">App consigliate</p>
            <div className="space-y-2">
              {[
                { name: 'Google Authenticator', desc: 'Semplice, nessun account necessario. Ideale per iniziare.' },
                { name: 'Authy', desc: 'Con backup su cloud. Ideale se cambi spesso dispositivo.' },
              ].map(app => (
                <div key={app.name} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{app.name}</p>
                    <p className="text-xs text-gray-500">{app.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
