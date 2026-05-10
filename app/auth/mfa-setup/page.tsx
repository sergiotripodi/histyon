import { AuthSidebar } from '@/components/auth/AuthSidebar'
import { MfaSetupForm } from '@/components/auth/MfaSetupForm'
import { getDictionary } from '@/lib/dictionary'
import { Shield, Smartphone, ScanLine, KeyRound } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configura verifica in due passaggi — Histyon' }

const steps = [
  {
    icon: Smartphone,
    title: 'Installa un\'app di autenticazione',
    desc: 'Scarica gratuitamente Google Authenticator oppure Authy sul tuo smartphone. Disponibili su App Store e Google Play.',
  },
  {
    icon: ScanLine,
    title: 'Scansiona il codice QR',
    desc: 'Apri l\'app, premi "+" e scegli "Scansiona codice QR". Punta la fotocamera al riquadro qui sopra: l\'account "Histyon" apparirà in automatico.',
  },
  {
    icon: KeyRound,
    title: 'Inserisci il codice a 6 cifre',
    desc: 'Nell\'app comparirà un numero di 6 cifre che cambia ogni 30 secondi. Inseriscilo nel campo sopra e premi "Attiva".',
  },
]

export default async function MfaSetupPage() {
  const dict = await getDictionary()

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      <AuthSidebar dict={dict} />

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-md w-full space-y-8 py-10">

          {/* Box principale */}
          <div className="border border-gray-200 bg-white p-8">
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

          {/* Guida */}
          <div className="border border-gray-100 bg-gray-50 p-8 space-y-6">
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-1">Come funziona</p>
              <h2 className="text-base font-bold text-gray-900">Tre passi per iniziare</h2>
            </div>

            <div className="space-y-5">
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

            <div className="pt-2 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-600">App consigliate:</span>{' '}
                <span className="font-medium text-gray-700">Google Authenticator</span> (semplice, nessun account necessario) ·{' '}
                <span className="font-medium text-gray-700">Authy</span> (con backup su cloud, ideale se cambi telefono)
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
