import { MfaSetupForm } from '@/components/auth/MfaSetupForm'
import { Shield } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configura verifica in due passaggi - Histyon' }

const steps = [
  {
    title: 'Installa un\'app di autenticazione',
    desc: 'Scarica gratuitamente Google Authenticator oppure Authy sul tuo smartphone. Disponibili su App Store e Google Play.',
  },
  {
    title: 'Scansiona il codice QR',
    desc: 'Apri l\'app, premi "+" e scegli "Scansiona codice QR". Punta la fotocamera al riquadro qui a sinistra: l\'account "Histyon" apparirà in automatico.',
  },
  {
    title: 'Inserisci il codice a 6 cifre',
    desc: 'Nell\'app comparirà un numero di 6 cifre che cambia ogni 30 secondi. Inseriscilo nel campo qui a sinistra e premi "Attiva".',
  },
]

export default function MfaSetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-4xl w-full flex flex-col sm:flex-row">

        {/* Left box — form */}
        <div className="flex-1 min-w-0 border border-gray-200 bg-white p-8 lg:p-10">
          <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-7">
            <Shield className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          </div>

          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
            Verifica in due passaggi
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            Proteggi il tuo account.
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Per accedere alla Console Histyon è obbligatorio configurare la verifica in due passaggi. Questo protegge i dati dei tuoi pazienti anche in caso di furto della password.
          </p>

          <MfaSetupForm />
        </div>

        {/* Right box — guide */}
        <div className="flex-1 min-w-0 border border-gray-200 border-t-0 sm:border-t sm:border-l-0 bg-gray-50 p-8 lg:p-10 space-y-8">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-1">Come funziona</p>
            <h2 className="text-lg font-bold text-gray-900">Tre passi per iniziare</h2>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">
              La verifica in due passaggi aggiunge un secondo livello di protezione al tuo account. Oltre alla password, ti verrà chiesto un codice temporaneo generato dalla tua app — così nessuno potrà accedere anche se conosce la tua password.
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
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Google Authenticator</p>
                  <p className="text-xs text-gray-500">Semplice, nessun account necessario. Ideale per iniziare.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Authy</p>
                  <p className="text-xs text-gray-500">Con backup su cloud. Ideale se cambi spesso dispositivo.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Hai bisogno di aiuto? Contatta il supporto all&#39;indirizzo{' '}
              <span className="font-medium text-gray-600">info@histyon.com</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
