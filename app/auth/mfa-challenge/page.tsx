import { AuthSidebar } from '@/components/auth/AuthSidebar'
import { MfaChallengeForm } from '@/components/auth/MfaChallengeForm'
import { getDictionary } from '@/lib/dictionary'
import { ShieldCheck, Smartphone, ScanLine, KeyRound } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Verifica identità — Histyon' }

const steps = [
  {
    icon: Smartphone,
    title: 'Apri l\'app di autenticazione',
    desc: 'Apri Google Authenticator o Authy sul tuo smartphone. Se non l\'hai ancora installata, ripartì dalla registrazione.',
  },
  {
    icon: ScanLine,
    title: 'Trova l\'account Histyon',
    desc: 'Nell\'elenco degli account trovi "Histyon Console". Vedrai un codice a 6 cifre che cambia ogni 30 secondi.',
  },
  {
    icon: KeyRound,
    title: 'Inserisci il codice',
    desc: 'Digita il codice nel campo qui sopra prima che scada. Se scade mentre scrivi, aspetta il codice successivo e riprova.',
  },
]

export default async function MfaChallengePage() {
  const dict = await getDictionary()

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      <AuthSidebar dict={dict} />

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-md w-full space-y-8 py-10">

          {/* Box principale */}
          <div className="border border-gray-200 bg-white p-8">
            <div className="w-10 h-10 border border-gray-200 flex items-center justify-center mb-7">
              <ShieldCheck className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </div>

            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
              Verifica in due passaggi
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Conferma la tua identità.
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Inserisci il codice a 6 cifre generato dalla tua app di autenticazione per accedere alla Console.
            </p>

            <MfaChallengeForm />
          </div>

          {/* Guida */}
          <div className="border border-gray-100 bg-gray-50 p-8 space-y-6">
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-1">Come accedere</p>
              <h2 className="text-base font-bold text-gray-900">Dove trovo il codice?</h2>
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
                Hai perso l&#39;accesso all&#39;app? Contatta il supporto Histyon all&#39;indirizzo{' '}
                <span className="font-medium text-gray-600">info@histyon.com</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
