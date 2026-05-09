'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UserPlus, LogIn, LayoutDashboard, Users, Upload,
  BarChart3, ScanSearch, FolderArchive, Settings,
  Trash2, HelpCircle, ChevronDown, CheckCircle2,
  AlertCircle, Clock, Microscope, ArrowRight, ChevronRight
} from 'lucide-react'

const SECTIONS = [
  { id: 'registrazione',  icon: UserPlus,        label: 'Registrazione' },
  { id: 'accesso',        icon: LogIn,           label: 'Accesso' },
  { id: 'dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'pazienti',       icon: Users,           label: 'Pazienti' },
  { id: 'analisi',        icon: Upload,          label: 'Nuova Analisi' },
  { id: 'risultati',      icon: BarChart3,       label: 'Risultati' },
  { id: 'viewer',         icon: ScanSearch,      label: 'Visualizzatore' },
  { id: 'qupath',         icon: FolderArchive,   label: 'QuPath' },
  { id: 'impostazioni',   icon: Settings,        label: 'Impostazioni' },
  { id: 'account',        icon: Trash2,          label: 'Eliminazione Account' },
  { id: 'faq',            icon: HelpCircle,      label: 'FAQ' },
]

const FAQS = [
  {
    q: 'Come recupero la password se la dimentico?',
    a: 'Dalla pagina di accesso, clicca su "Password dimenticata?" e inserisci la tua email istituzionale. Riceverai un link sicuro per reimpostare la password. Il link scade dopo 60 minuti.',
  },
  {
    q: 'Posso accedere alla console da più dispositivi contemporaneamente?',
    a: 'Sì. Histyon è accessibile da qualsiasi browser moderno su desktop, tablet o laptop. La sessione è indipendente per ogni dispositivo.',
  },
  {
    q: 'I dati dei pazienti sono al sicuro?',
    a: 'Sì. Ogni medico accede esclusivamente alle proprie cartelle. I dati sono cifrati in transito (TLS 1.3) e a riposo (AES-256). Il sistema applica politiche di isolamento per riga (Row Level Security) a livello di database.',
  },
  {
    q: 'Cosa succede se il caricamento del file viene interrotto?',
    a: 'Se la connessione si interrompe durante l\'upload, il ticket resterà nello stato "Caricamento". Puoi tornare sulla pagina dell\'analisi e usare il pulsante "Riprova upload" per riavviare il processo.',
  },
  {
    q: 'Come posso eliminare un paziente?',
    a: 'Apri la cartella del paziente dalla sezione Pazienti. Trovi il pulsante di eliminazione in basso nella pagina. Dovrai confermare inserendo il codice fiscale del paziente. L\'operazione rimuove permanentemente tutti i dati, inclusi file e analisi associate.',
  },
  {
    q: 'Perché un\'analisi è fallita?',
    a: 'Un\'analisi può fallire se il file caricato è corrotto, in un formato non supportato, o se il motore AI ha riscontrato un errore interno. In questi casi il ticket mostra lo stato "Errore". Puoi creare un nuovo ticket caricando di nuovo il file. Se il problema persiste, contatta il supporto.',
  },
  {
    q: 'Il visualizzatore non carica le immagini. Cosa faccio?',
    a: 'Verifica la connessione internet. Se l\'analisi è appena terminata, attendi qualche secondo e ricarica la pagina. Se il problema persiste dopo 5 minuti, contatta il supporto allegando il Ticket ID visibile nella pagina.',
  },
  {
    q: 'Quali formati di file sono supportati?',
    a: 'Il sistema accetta i principali formati di vetrino digitale: SVS, NDPI, TIFF, MRXS, SCN, CZI, BIF, DCM. La dimensione massima per singolo file è 5 GB.',
  },
  {
    q: 'L\'eliminazione dell\'account è reversibile?',
    a: 'No. L\'eliminazione è permanente e immediata. Vengono rimossi il profilo medico, tutte le cartelle pazienti, tutte le analisi e tutti i file archiviati. Non è possibile recuperare i dati dopo questa operazione.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-4 px-0 text-left group"
      >
        <span className="text-sm font-semibold text-gray-900 pr-4 group-hover:text-gray-700 transition-colors">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-5 animate-in fade-in slide-in-from-top-1 duration-150">
          {a}
        </p>
      )}
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-6 pb-4 border-b border-gray-100">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

export function DocContent() {
  const [activeSection, setActiveSection] = useState('registrazione')

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.15, rootMargin: '-80px 0px -55% 0px' }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  return (
    <div className="layout-container px-6 flex-1 flex flex-col md:flex-row gap-14 py-16">

      {/* Sticky sidebar */}
      <aside className="md:w-48 shrink-0">
        <nav className="sticky top-24 space-y-0.5">
          {SECTIONS.map(({ id, icon: Icon, label }) => {
            const active = activeSection === id
            return (
              <a
                key={id}
                href={`#${id}`}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </a>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 max-w-2xl space-y-20">

        {/* Registrazione */}
        <Section id="registrazione" title="Registrazione">
          <p className="text-sm text-gray-500 leading-relaxed">
            L'accesso a Histyon è riservato a professionisti medici abilitati. La registrazione richiede dati anagrafici,
            di residenza e professionali. Il processo si articola in tre passaggi.
          </p>
          <div className="space-y-3">
            <Step n={1}>
              <strong className="text-gray-800">Dati anagrafici</strong> — Nome, cognome, codice fiscale, data e luogo di nascita, genere, recapito telefonico.
            </Step>
            <Step n={2}>
              <strong className="text-gray-800">Residenza</strong> — Paese, indirizzo, CAP, città e provincia/stato.
            </Step>
            <Step n={3}>
              <strong className="text-gray-800">Dati professionali e credenziali</strong> — Numero di albo, struttura ospedaliera/clinica di riferimento, email istituzionale e password sicura.
            </Step>
          </div>
          <Tip>
            Dopo la registrazione riceverai un'email di conferma all'indirizzo indicato. Clicca il link nell'email per attivare l'account.
            Se non la trovi, controlla la cartella Spam o Promozioni.
          </Tip>
          <p className="text-sm text-gray-500 leading-relaxed">
            La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale.
          </p>
        </Section>

        {/* Accesso */}
        <Section id="accesso" title="Accesso alla Console">
          <p className="text-sm text-gray-500 leading-relaxed">
            Dalla pagina di accesso inserisci l'email istituzionale e la password scelti durante la registrazione.
          </p>
          <div className="border border-gray-100 p-5 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password dimenticata</p>
            <div className="space-y-2">
              <Step n={1}>Clicca su <strong className="text-gray-800">"Password dimenticata?"</strong> sotto il campo password.</Step>
              <Step n={2}>Inserisci la tua email istituzionale e clicca <strong className="text-gray-800">"Invia link di reset"</strong>.</Step>
              <Step n={3}>Apri l'email ricevuta e clicca il link sicuro. Il link scade dopo 60 minuti.</Step>
              <Step n={4}>Scegli una nuova password e conferma.</Step>
            </div>
          </div>
          <Tip>
            Se l'account non è ancora stato verificato via email, non sarà possibile accedere.
            Completa prima la verifica dalla email di conferma ricevuta alla registrazione.
          </Tip>
        </Section>

        {/* Dashboard */}
        <Section id="dashboard" title="Dashboard — Panoramica">
          <p className="text-sm text-gray-500 leading-relaxed">
            La dashboard mostra in tempo reale le statistiche cliniche del tuo account con andamento degli ultimi 7 giorni.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: BarChart3,    label: 'Analisi totali',      desc: 'Numero complessivo di ticket di analisi creati.' },
              { icon: Users,       label: 'Pazienti registrati',  desc: 'Totale cartelle pazienti nel tuo archivio.' },
              { icon: CheckCircle2,label: 'Completate',           desc: 'Analisi elaborate con successo e risultati disponibili.' },
              { icon: Clock,       label: 'In elaborazione',      desc: 'Analisi in coda o in corso di elaborazione AI.' },
              { icon: AlertCircle, label: 'Fallite',              desc: 'Analisi con errore. Verificare e ricaricare il file.' },
              { icon: BarChart3,   label: 'Spazio utilizzato',    desc: 'Volume totale di file archiviati (input + output).' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 border border-gray-100 p-4">
                <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800 mb-0.5">{label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            I dati si aggiornano ad ogni caricamento della pagina. Il pannello di navigazione a sinistra fornisce accesso rapido a Pazienti, Analisi e Impostazioni.
          </p>
        </Section>

        {/* Pazienti */}
        <Section id="pazienti" title="Gestione Pazienti">
          <p className="text-sm text-gray-500 leading-relaxed">
            Ogni paziente ha una cartella dedicata che raccoglie i dati anagrafici e lo storico completo di tutte le analisi.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Creare una nuova cartella paziente</p>
            <div className="space-y-2">
              <Step n={1}>Vai alla sezione <strong className="text-gray-800">Pazienti</strong> dal menu a sinistra.</Step>
              <Step n={2}>Clicca <strong className="text-gray-800">"Nuovo Paziente"</strong> in alto a destra.</Step>
              <Step n={3}>Compila tutti i campi obbligatori contrassegnati con (*): dati anagrafici, contatti e domicilio.</Step>
              <Step n={4}>Clicca <strong className="text-gray-800">"Crea Cartella Paziente"</strong> per salvare.</Step>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Aprire la cartella paziente</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Dalla lista pazienti, clicca <strong className="text-gray-700">"Apri Cartella"</strong> sul paziente desiderato.
              Troverai i dati anagrafici, i contatti e tutte le analisi effettuate per quel paziente.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Eliminare un paziente</p>
            <div className="space-y-2">
              <Step n={1}>Apri la cartella del paziente.</Step>
              <Step n={2}>Scorri in fondo alla pagina e clicca <strong className="text-gray-800">"Elimina Paziente"</strong>.</Step>
              <Step n={3}>Inserisci il codice fiscale del paziente per confermare.</Step>
            </div>
          </div>
          <Warn>
            L'eliminazione è permanente e immediata. Vengono rimossi tutti i dati anagrafici, le analisi e i file associati al paziente.
            Questa operazione non può essere annullata.
          </Warn>
        </Section>

        {/* Analisi */}
        <Section id="analisi" title="Nuova Analisi Istologica">
          <p className="text-sm text-gray-500 leading-relaxed">
            Per avviare un'analisi è necessario avere almeno un paziente registrato. Il file viene trasmesso in modo sicuro al cloud e l'elaborazione avviene automaticamente.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Come caricare un vetrino</p>
            <div className="space-y-2">
              <Step n={1}>Dalla sezione <strong className="text-gray-800">Analisi</strong>, clicca <strong className="text-gray-800">"Nuova Analisi"</strong>.</Step>
              <Step n={2}>Seleziona il paziente dal menu a tendina.</Step>
              <Step n={3}>Trascina il file nell'area di caricamento oppure clicca per selezionarlo. Formati accettati: SVS, NDPI, TIFF, MRXS, SCN, CZI, BIF, DCM (max 5 GB).</Step>
              <Step n={4}>Aggiungi eventuali note cliniche nel campo apposito (opzionale).</Step>
              <Step n={5}>Clicca <strong className="text-gray-800">"Avvia Upload e Analisi"</strong>.</Step>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">Stati dell'analisi</p>
            {[
              { icon: Upload,       label: 'Caricamento',    desc: 'Il file è in trasferimento verso il cloud.' },
              { icon: Clock,       label: 'In coda',         desc: 'Upload completato. Il motore AI è in attesa di elaborare il file.' },
              { icon: Microscope,  label: 'In elaborazione', desc: 'La rete neurale sta segmentando e classificando il tessuto.' },
              { icon: CheckCircle2,label: 'Completata',      desc: 'Analisi terminata. Risultati e file di output disponibili.' },
              { icon: AlertCircle, label: 'Errore',          desc: 'Si è verificato un problema. Riprova con il pulsante "Riprova Upload".' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[130px]">
                  <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                </div>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>

          <Tip>
            Non è necessario tenere il browser aperto durante l'elaborazione. L'analisi continua sul server e i risultati saranno disponibili al tuo prossimo accesso.
          </Tip>
        </Section>

        {/* Risultati */}
        <Section id="risultati" title="Risultati dell'Analisi">
          <p className="text-sm text-gray-500 leading-relaxed">
            Al completamento dell'analisi vengono generati automaticamente i risultati AI e i file di output scaricabili.
          </p>
          <div className="space-y-3">
            {[
              { label: 'Statistiche tessuto',     desc: 'Percentuale di tessuto patologico, numero di glomeruli totali e scleroticizzati, metriche di segmentazione per regione.' },
              { label: 'Visualizzatore integrato',desc: 'Anteprima ad alta risoluzione del vetrino con navigazione pan & zoom. Disponibile dal pulsante "Viewer" sulla pagina dell\'analisi.' },
              { label: 'Progetto QuPath',         desc: 'File .zip scaricabile con le annotazioni AI pre-caricate. Apri in QuPath per la revisione manuale di secondo livello.' },
              { label: 'Regioni di analisi',      desc: 'Archivio ZIP con le maschere delle regioni annotate e le coordinate di segmentazione.' },
            ].map(({ label, desc }) => (
              <div key={label} className="border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-800 mb-1">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <Tip>
            I risultati AI sono un supporto diagnostico probabilistico e devono essere sempre validati dal medico patologo.
            Histyon non sostituisce il giudizio clinico professionale.
          </Tip>
        </Section>

        {/* Viewer */}
        <Section id="viewer" title="Visualizzatore Integrato">
          <p className="text-sm text-gray-500 leading-relaxed">
            Il visualizzatore consente di navigare il vetrino digitale direttamente nel browser, senza installare software aggiuntivo.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'Scroll',   action: 'Zoom avanti / indietro' },
              { key: 'Click + trascina', action: 'Spostamento panoramico' },
              { key: '+  /  −', action: 'Zoom avanti / indietro' },
              { key: 'Schermo intero', action: 'Modalità fullscreen' },
            ].map(({ key, action }) => (
              <div key={key} className="flex items-center gap-3 border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="text-xs font-mono font-bold bg-white border border-gray-200 px-2 py-1 shrink-0">{key}</span>
                <span className="text-xs text-gray-600">{action}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Il viewer carica progressivamente le tessere dell'immagine in base al livello di zoom.
            Per un'esperienza ottimale si consiglia una connessione stabile.
          </p>
        </Section>

        {/* QuPath */}
        <Section id="qupath" title="Integrazione QuPath">
          <p className="text-sm text-gray-500 leading-relaxed">
            Ogni analisi completata include un progetto QuPath scaricabile con tutte le annotazioni AI già caricate,
            pronto per la revisione manuale di secondo livello.
          </p>
          <div className="space-y-2">
            <Step n={1}>Dalla pagina dell'analisi, clicca <strong className="text-gray-800">"QuPath"</strong> per scaricare il file .zip.</Step>
            <Step n={2}>Estrai l'archivio in una cartella locale sul tuo computer.</Step>
            <Step n={3}>Apri QuPath e seleziona <strong className="text-gray-800">File → Apri Progetto</strong>.</Step>
            <Step n={4}>Naviga nella cartella estratta e seleziona il file <strong className="text-gray-800">project.qpproj</strong>.</Step>
            <Step n={5}>Il vetrino si apre con le annotazioni AI già sovrapposte e pronte per la revisione.</Step>
          </div>
          <div className="flex items-center gap-3 border border-gray-100 p-4">
            <FolderArchive className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              QuPath è un software gratuito open-source. Versione minima consigliata: v0.4+.{' '}
              <a href="https://qupath.github.io" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-gray-300 hover:decoration-gray-700 transition-colors">
                Scarica QuPath →
              </a>
            </p>
          </div>
        </Section>

        {/* Impostazioni */}
        <Section id="impostazioni" title="Impostazioni Profilo">
          <p className="text-sm text-gray-500 leading-relaxed">
            Dalla sezione Impostazioni puoi aggiornare i tuoi dati in qualsiasi momento.
          </p>
          <div className="space-y-4">
            <div className="border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-800 mb-2">Dati personali</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Modifica nome, cognome, telefono, luogo di nascita, data di nascita e residenza. Clicca <strong className="text-gray-700">"Salva modifiche"</strong> per confermare.
              </p>
            </div>
            <div className="border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-800 mb-2">Email</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Il cambio di email richiede una conferma al nuovo indirizzo prima di diventare effettivo.
              </p>
            </div>
            <div className="border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-800 mb-2">Password</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Inserisci la nuova password e confermala nel campo apposito. Lascia i campi vuoti per mantenere la password attuale.
              </p>
            </div>
          </div>
        </Section>

        {/* Eliminazione Account */}
        <Section id="account" title="Eliminazione Account">
          <p className="text-sm text-gray-500 leading-relaxed">
            Puoi richiedere l'eliminazione permanente del tuo account in qualsiasi momento dalla sezione Impostazioni.
          </p>
          <div className="space-y-2">
            <Step n={1}>Vai in <strong className="text-gray-800">Impostazioni</strong> dal menu a sinistra della console.</Step>
            <Step n={2}>Espandi la sezione <strong className="text-gray-800">"Zona Pericolosa"</strong> in fondo alla pagina.</Step>
            <Step n={3}>Clicca <strong className="text-gray-800">"Elimina definitivamente"</strong>.</Step>
            <Step n={4}>Inserisci la tua password corrente nel campo di conferma e clicca per confermare.</Step>
          </div>
          <Warn>
            L'eliminazione è permanente e immediata. Verranno rimossi il profilo medico, tutte le cartelle pazienti, tutte le analisi
            e tutti i file archiviati nel cloud. Non è possibile recuperare i dati dopo questa operazione.
          </Warn>
          <p className="text-sm text-gray-500 leading-relaxed">
            In conformità al Regolamento GDPR (Art. 17 — Diritto alla cancellazione), tutti i dati personali vengono
            eliminati immediatamente e in modo irreversibile dai nostri sistemi.
          </p>
        </Section>

        {/* FAQ */}
        <Section id="faq" title="Domande Frequenti">
          <div className="divide-y divide-gray-100 border border-gray-100 px-5">
            {FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
          <div className="flex items-center justify-between border border-gray-100 p-5">
            <div>
              <p className="text-sm font-semibold text-gray-800">Non hai trovato risposta?</p>
              <p className="text-xs text-gray-400 mt-0.5">Il nostro team risponde entro 24 ore.</p>
            </div>
            <a
              href="mailto:info@histyon.com"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-900 hover:bg-gray-50 transition-all"
            >
              Contattaci <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </Section>

      </main>
    </div>
  )
}
