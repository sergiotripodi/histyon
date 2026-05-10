export const it = {
  metadata: {
    titleTemplate: '%s | Histyon',
    defaultTitle: 'Histyon - Diagnostica Medica Avanzata',
    description: "Piattaforma cloud-native per gestione, archiviazione e analisi AI di vetrini digitali (WSI). Infrastruttura web scalabile e sicura per l'istopatologia.",
    keywords: "istopatologia, WSI, patologia digitale, diagnostica medica, AI patologia, cloud sanitario",
    openGraph: {
      title: "Histyon - Diagnostica Medica Avanzata",
      description: "Piattaforma cloud-native per la gestione di vetrini digitali (WSI) e analisi AI.",
      siteName: "Histyon"
    },
    loginTitle: "Accedi",
    registerTitle: "Registrati"
  },
  landing: {
    hero: {
      title1: "Histopathology",
      title2: "Cloud Native.",
      desc: "Gestione, archiviazione e analisi AI di vetrini digitali (WSI). Supera i limiti dei software desktop con un'infrastruttura web scalabile e sicura.",
      badge1: "WSI Support",
      badge2: "Unlimited Storage",
      badge3: "AI Analysis",
      cta1: "Richiedi Accesso",
      cta2: "Scopri di più"
    },
    workflow: {
      title: "Il workflow",
      titleColor: "digitale.",
      desc: "Un'architettura progettata per gestire file pesanti senza latenza, garantendo la massima precisione diagnostica.",
      f1_label: "01 — Ingestione",
      f1_title: "Archiviazione Illimitata",
      f1_desc: "Caricamento diretto e veloce di biopsie da diversi Gigabyte. Il nostro cloud elastico elimina la necessità di server fisici costosi in ospedale.",
      f2_label: "02 — Analisi",
      f2_title: "Morfometria AI",
      f2_desc: "La rete neurale elabora l'immagine in background, identificando tessuti sani e patologici con metriche oggettive e riproducibili.",
      f2_tag1: "Segmentation",
      f2_tag2: "Classification",
      f3_label: "03 — Report",
      f3_title: "Dati & QuPath",
      f3_desc: "Ottieni report strutturati e accedi direttamente al progetto QuPath pre-configurato per un'analisi microscopica di secondo livello.",
      f4_label: "04 — Privacy",
      f4_title: "Sicurezza dei Dati",
      f4_desc: "Isolamento totale dei pazienti. Ogni medico accede in modo crittografato esclusivamente ai propri casi. Compliance GDPR nativa."
    },
    cta: {
      title: "Ready to deploy?",
      desc: "L'infrastruttura Histyon è pronta. Carica il primo vetrino e lascia che l'AI faccia il lavoro pesante.",
      btn: "Crea account",
      note: "Accesso riservato a personale medico e ricercatori."
    },
    footer: {
      rights: "Tutti i diritti riservati.",
      credits: "Credits",
      dev: "Web Design & Development:",
      platform: "Piattaforma",
      support: "Supporto",
      legalSection: "Legale",
      login: "Accedi",
      register: "Registrati",
      docs: "Documentazione",
      contact: "Contattaci",
      legal: "Info Legali"
    },
    header: { toConsole: "Torna alla Console" }
  },
  auth: {
    sidebar: {
      footer: "Histyon Console \u00A9 2026",
      secure: "Connessione Sicura",
      testimonials: [
        { text: "Un passo avanti incredibile nella gestione dei vetrini digitali.", author: "Dr. A. Bianchi", role: "Patologo Senior" },
        { text: "L'AI riduce i tempi di screening del 40%.", author: "Dr. M. Rossi", role: "Oncologia Clinica" },
        { text: "Sicurezza dei dati e velocità. Finalmente.", author: "Ing. G. Verdi", role: "DPO Ospedaliero" }
      ]
    },
    login: {
      title: "Accedi",
      heading: "Accesso Console",
      subheading: "Inserisci le credenziali istituzionali.",
      noCredentials: "Non hai le credenziali?",
      requestAccess: "Richiedi Accesso",
      medicalProfile: "Profilo medico SSN",
      btn: "Accedi",
      forgotPassword: "Password dimenticata?",
      successRedirect: "Account verificato. Effettua l'accesso.",
      emailConfirmed: "Email confermata con successo. Ora puoi accedere.",
      linkInvalid: "Link non valido o scaduto.",
      errorInvalidCredentials: "Email o password non validi.",
      errorAccountLocked: "Il tuo account è temporaneamente bloccato.",
      errorUnverified: "Verifica la tua email prima di accedere.",
      errorGeneric: "Si è verificato un errore durante l'accesso.",
      successRegistered: "Registrazione completata. Effettua l'accesso.",
      successPasswordReset: "Password aggiornata. Effettua l'accesso."
    },
    forgotPassword: {
      title: "Recupero Password",
      heading: "Password dimenticata?",
      subheading: "Inserisci la tua email istituzionale. Ti invieremo un link sicuro per reimpostare la password.",
      btn: "Invia Link di Reset",
      backToLogin: "Torna al Login",
      successTitle: "Email Inviata",
      successDesc: "Se l'indirizzo è presente nei nostri sistemi, riceverai a breve le istruzioni per il reset.",
      errorGeneric: "Si è verificato un errore. Riprova più tardi."
    },
    updatePassword: {
      title: "Nuova Password",
      heading: "Imposta Nuova Password",
      subheading: "Scegli una password sicura per il tuo account.",
      btn: "Aggiorna Password",
      success: "Password aggiornata con successo. Reindirizzamento...",
      errorMatch: "Le password non coincidono.",
      errorWeak: "La password non soddisfa i requisiti di sicurezza.",
      errorSame: "La nuova password deve essere diversa da quella attuale.",
      errorUpdateFailed: "Impossibile aggiornare la password. Riprova.",
      errorDefault: "Si è verificato un errore."
    },
    deleted: {
      heading: "Account eliminato",
      subheading: "Ci dispiace vederti andare.",
      message: "Il tuo account è stato eliminato con successo. Tutti i dati personali, i pazienti, le analisi e i file sono stati rimossi permanentemente dai nostri server.",
      homeBtn: "Torna alla Home"
    },
    verified: {
      title: "Email Confermata",
      desc: "Il tuo account è stato attivato con successo.",
      btn: "Accedi"
    },
    register: {
      title: "Registrati",
      heading: "Nuovo Profilo",
      subheading: "Configurazione guidata utente.",
      alreadyAccount: "Possiedi già un account?",
      accessConsole: "Accedi alla Console",
      steps: {
        step: "Passaggio",
        registry: "Anagrafica", 
        residence: "Residenza", 
        profession: "Credenziali"
      },
      buttons: { back: "Indietro", next: "Continua", complete: "Crea Account" },
      success: {
        title: "Controlla la tua Email",
        desc: "Ti abbiamo inviato un link di conferma. Per attivare il tuo account e accedere alla dashboard, è necessario verificare l'indirizzo email.",
        spamNotice: "Non hai ricevuto l'email? Controlla nella cartella Spam o Promozioni.",
        backToLogin: "Torna al Login"
      }
    },
    form: {
      labels: {
        firstName: "Nome", lastName: "Cognome", fiscalCode: "Codice Fiscale", gender: "Sesso",
        dob: "Data di nascita", birthPlace: "Luogo di Nascita", phone: "Telefono Cellulare",
        country: "Paese", address: "Indirizzo", civic: "Civico", zip: "CAP", city: "Città", province: "Provincia",
        medicalLicense: "N. Ordine", hospital: "Struttura", email: "Email Istituzionale", password: "Password Sicura",
        emailSimple: "Email", passwordSimple: "Password", confirmPassword: "Conferma Password"
      },
      placeholders: {
        name: "Mario", surname: "Rossi", cf: "RSSMRA...", city: "Città", address: "Via/Piazza", civic: "N.",
        zip: "00100", municipality: "Comune", province: "Provincia/Stato", license: "Es. 12345/RM",
        hospital: "Es. Policlinico...", select: "Seleziona", day: "Giorno", month: "Mese", year: "Anno",
        phonePlaceholder: "+39 333...", emailPlaceholder: "email@paziente.it"
      },
      options: { male: "Maschio", female: "Femmina", other: "Altro" },
      sections: { credentials: "Credenziali Accesso", identity: "Identità", contacts: "Contatti", domicile: "Domicilio" },
      warnings: { attention: "Attenzione", required: "Obbligatorio", requiredSymbol: "*", loading: "Elaborazione..." }
    }
  },
  dashboard: {
    header: { console: "Console", unassigned: "Non assegnato", logout: "Esci", role: "Medico", assistance: "Assistenza" },
    tabs: { patients: "Pazienti", analysis: "Analisi", profile: "Dati Anagrafici", settings: "Impostazioni" },
    titles: {
      main: "Console Medica", patientRegistry: "Anagrafica Pazienti", globalHistory: "Cronologia Globale Analisi",
      uploadHistory: "Storico Caricamenti", patientFolder: "Cartella Personale"
    },
    patients: {
      empty: { title: "Nessun paziente registrato.", subtitle: "Inizia aggiungendone uno.", btnNew: "Nuovo Paziente" },
      card: { openFolder: "Apri Cartella" },
      modal: {
        title: "Anagrafica Paziente", subtitle: "Compilare tutti i campi obbligatori (*)",
        btnSave: "Crea Cartella Paziente", btnSaving: "Salvataggio..."
      },
      delete: {
        title: "Elimina Paziente", subtitle: "Tutti i dati verranno eliminati definitivamente. Operazione irreversibile.",
        warningLabel: "Attenzione", warning: "Tutti i file di analisi (scansioni, tile DZI, progetti QuPath, maschere di regione) verranno eliminati definitivamente dallo storage cloud.",
        ticketCount: "analisi saranno eliminate",
        confirm: "Digita il codice fiscale per confermare:", placeholder: "Codice fiscale",
        btnCancel: "Annulla", btnDelete: "Elimina Definitivamente", btnDeleting: "Eliminazione..."
      }
    },
    tickets: {
      empty: "Nessuna analisi presente in archivio.",
      table: { id: "Ticket ID", patient: "Paziente", file: "File", date: "Data Caricamento", status: "Stato" },
      status: {
        completed: "Completato", processing: "In Elaborazione", queued: "In Coda", uploading: "Caricamento...", error: "Errore",
        failedAnalysis: "ANALISI FALLITA"
      },
      steps: { uploading: "Caricamento", queued: "In Coda Cloud", processing: "Analisi AI", completed: "Completato" },
      detail: { analysis: "Analisi", patient: "Paziente" }
    },
    upload: {
      title: "Nuova Analisi Istologica", dragDrop: "Trascina qui il file (SVS, NDPI, TIFF)", remove: "Rimuovi",
      notesPlaceholder: "Aggiungi note cliniche (opzionale)...", btnStart: "Avvia Upload e Analisi",
      sending: "Invio sicuro al Cloud...", successTitle: "Ticket Creato", successMsg: "In attesa dell'AI...",
      errorTitle: "Errore Upload", retry: "Riprova"
    },
    realtime: {
      sourceData: "Dati Sorgente", inputFile: "Nome File Input", size: "Dimensione", date: "Data",
      clinicalNotes: "Note Cliniche", noNotes: "Nessuna nota clinica inserita.",
      errorAnalysis: "Errore Analisi", completedAnalysis: "Analisi Completata", progressStatus: "Stato Avanzamento",
      statusLabel: "STATUS", processInterrupted: "Processo Interrotto", errorDetails: "Dettagli Errore:",
      genericError: "Errore generico durante l'elaborazione del file.", retryUpload: "Riprova Caricamento",
      outputFile: "File Output Generato", download: "Scarica", resultsJson: "Risultati AI (JSON)",
      noJson: "Nessun dato strutturato (ai_results) disponibile.",
      queuedTitle: "In Coda sul Cloud", processingTitle: "Analisi in Corso",
      queuedDesc: "Il file è al sicuro. Aspettiamo che il motore AI lo prenda in carico.",
      processingDesc: "Sto analizzando i tessuti e generando i risultati JSON.",
      outputNotReady: "File di output non ancora pronto.",
      interrupted: "Analisi Interrotta",
      reportReady: "Report Disponibile",
      analyzing: "Analisi in corso",
      openViewer: "Visualizzatore",
      downloadQupath: "QuPath",
      downloadRegion: "Regioni",
      tissueStats: "Statistiche",
      loadingTissues: "Caricamento...", reportUnavailable: "Report Non Disponibile"
    },
    results: {
      title: "Risultati Analisi AI", tissueView: "Visualizzazione Tessuto",
      previewNote: "Anteprima rapida. Per l'analisi profonda, scarica il progetto qui sotto.",
      sickTissue: "Tessuto Malato", totalGlom: "Glomeruli Totali", scleroGlom: "Glomeruli Sclerotici",
      fullProject: "Progetto QuPath Completo", downloadZip: "Scarica il file .zip per aprire l'analisi sul tuo PC.",
      btnDownload: "Scarica Progetto (.zip)"
    },
    profile: { dob: "Data di Nascita", birthPlace: "Luogo di Nascita", residence: "Residenza", contacts: "Contatti" },
    settings: {
      title: "Impostazioni Profilo",
      subtitle: "Gestisci i tuoi dati personali, le preferenze e la sicurezza dell'account.",
      tabs: { profile: "Dati Personali", security: "Sicurezza" },
      sections: {
        personal: "Informazioni Personali",
        residence: "Residenza",
        professional: "Dati Professionali",
        email: "Indirizzo Email",
        password: "Password",
        security: "Account e Sicurezza"
      },
      form: {
        updateBtn: "Salva Modifiche",
        success: "Profilo aggiornato con successo.",
        emailNotice: "Modificando l'email riceverai una conferma.",
        passwordNotice: "Lascia vuoto per mantenere la password attuale.",
        savePassword: "Imposta Nuova Password",
        newPassword: "Nuova Password",
        confirmPassword: "Conferma Password",
        updating: "Salvataggio..."
      },
      danger: {
        title: "Zona Pericolosa",
        subtitle: "Questa azione è irreversibile e rimuove tutti i dati.",
        deleteBtn: "Elimina Account",
        deleteDesc: "Elimina definitivamente il tuo account, tutti i pazienti, tutte le analisi e tutti i file archiviati.",
        modal: {
          title: "Elimina il tuo account",
          warning: "Stai per eliminare permanentemente:",
          items: [
            "Il tuo account e profilo medico",
            "Tutti i pazienti registrati",
            "Tutte le analisi e i ticket",
            "Tutti i file archiviati su cloud"
          ],
          irreversible: "Questa azione è irreversibile e non può essere annullata.",
          passwordLabel: "Conferma inserendo la tua password",
          confirmBtn: "Elimina definitivamente",
          cancelBtn: "Annulla",
          deleting: "Eliminazione in corso...",
          errorWrong: "Password non corretta. Riprova.",
          errorGeneric: "Errore durante l'eliminazione. Riprova."
        }
      }
    }
  },
  legal: {
    title: "Centro Legale & Privacy",
    subtitle: "La trasparenza è fondamentale nella diagnostica medica. Qui trovi tutte le informazioni su come proteggiamo i tuoi dati e quelli dei tuoi pazienti.",
    update: "Ultimo aggiornamento: 21 Gennaio 2026",
    tabs: { privacy: "Privacy Policy", terms: "Termini di Servizio", cookie: "Cookie Policy", dpa: "Trattamento Dati (DPA)" },
    content: {
      privacyTitle: "Informativa sulla Privacy", 
      privacySub: "Ai sensi del Regolamento UE 2016/679 (GDPR)",
      termsTitle: "Termini e Condizioni", 
      termsSub: "Regolamento per l'utilizzo della Console Medica",
      cookieTitle: "Cookie Policy", 
      cookieSub: "Trasparenza sui tracciamenti",
      dpaTitle: "Data Processing & Sicurezza", 
      dpaSub: "Appendice tecnica sulla sicurezza dei dati",
      disclaimer: "Disclaimer Medico",
      disclaimerText: "Histyon è uno strumento di supporto tecnico e non sostituisce in alcun modo il giudizio professionale del medico. L'analisi AI è probabilistica e deve essere sempre validata da un patologo umano. Histyon non è responsabile per diagnosi errate basate esclusivamente sull'output dell'software.",
      
      privacy: {
        sec1: { 
            title: "1. Titolare del Trattamento", 
            body: "Il Titolare del trattamento dei dati relativi alla registrazione dei Medici (Dati Account) è Histyon Team, con sede legale in Italia.\n\nPer quanto concerne i Dati Sanitari dei Pazienti (inclusi dati anagrafici e immagini istologiche WSI) caricati sulla piattaforma, il Medico professionista registrato agisce in qualità di Titolare del Trattamento (Data Controller) ai sensi dell'art. 4 del GDPR. Histyon agisce esclusivamente come Responsabile del Trattamento (Data Processor), trattando i dati per conto del Titolare al solo fine di fornire il servizio di archiviazione e analisi AI." 
        },
        sec2: { 
            title: "2. Tipologia di Dati Raccolti", 
            body: "La piattaforma raccoglie e processa le seguenti categorie di dati:\n\n- Dati del Professionista: Nome, Cognome, Email istituzionale, Numero di iscrizione all'ordine, Struttura di appartenenza.\n- Dati di Utilizzo: Log di accesso, indirizzi IP, timestamp di caricamento file (conservati per scopi di sicurezza e audit trail).\n- Dati Particolari (Pazienti): Dati anagrafici pseudonimizzati e immagini diagnostiche ad alta risoluzione. Questi dati sono criptati e accessibili esclusivamente tramite le credenziali del medico titolare." 
        },
        sec3: { 
            title: "3. Finalità e Base Giuridica", 
            body: "I dati sono trattati per le seguenti finalità:\n\n- Erogazione del servizio SaaS: Archiviazione sicura e visualizzazione remota delle immagini (Esecuzione contrattuale).\n- Supporto Diagnostico: Elaborazione automatizzata tramite algoritmi di Intelligenza Artificiale per il conteggio e la segmentazione tissutale (Contratto e Legittimo Interesse).\n- Sicurezza e Compliance: Monitoraggio di accessi anomali e protezione contro frodi o abusi (Obbligo di legge e Legittimo interesse)." 
        },
        sec4: { 
            title: "4. Luogo del Trattamento e Fornitori", 
            body: "I dati sono ospitati su infrastrutture cloud localizzate all'interno dello Spazio Economico Europeo (SEE).\n\nFornitori principali:\n- Supabase (Database & Auth): Dublino, Irlanda (AWS eu-west-1).\n- Cloudflare R2 (Storage WSI): Crittografia lato server e distribuzione sicura."
        },
        sec5: { title: "5. Diritto alla Cancellazione (Art. 17 GDPR)", body: "Hai il diritto alla cancellazione permanente dei dati del paziente e di tutti i file di analisi associati. La cancellazione può essere eseguita in qualsiasi momento dalla dashboard ed è immediata e irreversibile: scansioni, tile DZI, progetti QuPath e maschere di regione vengono rimossi definitivamente dal cloud.\n\nPuoi inoltre eliminare il tuo intero account medico in qualsiasi momento dalla sezione Impostazioni → Zona Pericolosa. L'eliminazione dell'account comporta la rimozione permanente e irreversibile di: profilo medico, tutti i pazienti registrati, tutte le analisi e i file archiviati su cloud. Riceverai una conferma via email al termine del processo." },
        sec6: { title: "6. Portabilità e Altri Diritti", body: "Ai sensi del GDPR hai il diritto di: accedere ai tuoi dati personali, rettificarli, limitarne il trattamento e opporti al trattamento stesso. Per esercitare tali diritti puoi contattarci a info@histyon.com. Ci impegniamo a rispondere entro 30 giorni dalla ricezione della richiesta." }
      },
      terms: {
        sec1: { 
            title: "1. Requisiti di Accesso", 
            body: "L'accesso alla Console Medica Histyon è riservato esclusivamente a medici chirurghi, patologi e ricercatori clinici regolarmente iscritti al rispettivo ordine professionale.\n\nDurante la fase di registrazione, è richiesto l'inserimento del numero di licenza medica. Histyon si riserva il diritto di effettuare verifiche a campione e di sospendere o cancellare account che non soddisfano i requisiti di idoneità professionale. È fatto divieto assoluto di utilizzare la piattaforma per scopi non clinici o di ricerca non autorizzata." 
        },
        sec2: { 
            title: "2. Responsabilità sui Dati Caricati", 
            body: "L'Utente (Medico) dichiara e garantisce di aver ottenuto il consenso informato dal paziente per il caricamento dei dati e delle immagini istologiche sulla piattaforma, in conformità con le leggi vigenti (GDPR, HIPAA, leggi locali).\n\nL'Utente è l'unico responsabile della legittimità, veridicità e accuratezza dei dati caricati. Histyon non effettua controlli di merito sui contenuti clinici caricati, limitandosi a fornire l'infrastruttura tecnologica." 
        },
        sec3: {
            title: "3. Sicurezza dell'Account",
            body: "Le credenziali di accesso (Email e Password) sono strettamente personali e non cedibili. L'Utente è responsabile della custodia delle proprie credenziali e deve notificare tempestivamente a Histyon qualsiasi utilizzo non autorizzato o sospetta violazione della sicurezza.\n\nÈ vietata la condivisione dell'account (Account Sharing) tra più professionisti. Ogni medico deve disporre di un proprio account univoco per garantire la tracciabilità delle operazioni (Audit Logging)."
        },
        sec4: {
            title: "4. Cancellazione dell'Account",
            body: "L'Utente può richiedere la cancellazione del proprio account in qualsiasi momento dalla sezione Impostazioni → Zona Pericolosa della Console. La cancellazione è subordinata alla verifica dell'identità tramite password ed è immediata e definitiva.\n\nAll'eliminazione dell'account vengono cancellati permanentemente: il profilo medico, tutti i pazienti registrati, tutte le analisi e i file archiviati su Cloudflare R2. Histyon non mantiene copie di backup dei dati dopo la cancellazione. L'Utente riceverà una conferma email al completamento del processo."
        },
        sec5: {
            title: "5. Accesso Gratuito e Modifiche al Servizio",
            body: "Nella fase attuale, l'accesso alla Console Medica Histyon è fornito gratuitamente a tutti gli utenti registrati e verificati. Histyon si riserva il diritto di introdurre piani a pagamento o modificare le condizioni economiche del servizio in futuro.\n\nIn caso di variazioni significative — inclusa l'introduzione di un canone — gli utenti registrati saranno informati con un preavviso minimo di 30 giorni tramite email all'indirizzo registrato sull'account. L'utilizzo continuato del servizio dopo tale preavviso costituisce accettazione delle nuove condizioni."
        }
      },
      cookie: {
        sec1: { 
            title: "1. Cosa sono i cookie", 
            body: "I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell'utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva. Histyon utilizza tecnologie simili (come LocalStorage) per migliorare l'esperienza utente." 
        },
        sec2: { 
            title: "2. Cookie Tecnici (Essenziali)", 
            body: "La piattaforma utilizza esclusivamente cookie tecnici strettamente necessari per il funzionamento del servizio, tra cui:\n\n- Cookie di Sessione: Per mantenere l'utente autenticato durante la navigazione (gestiti da Supabase Auth).\n- Cookie di Sicurezza: Per prevenire attacchi di tipo CSRF (Cross-Site Request Forgery).\n\nLa lingua dell'interfaccia viene rilevata automaticamente dal browser (header Accept-Language), senza cookie di preferenza linguistica.\n\nPer l'installazione di tali cookie non è richiesto il preventivo consenso degli utenti." 
        },
        sec3: { 
            title: "3. Assenza di Profilazione", 
            body: "Histyon NON utilizza cookie di profilazione per scopi pubblicitari o di marketing, né cede dati di navigazione a terze parti per tali scopi. Eventuali strumenti di monitoraggio errori (es. Sentry) raccolgono dati tecnici in forma anonimizzata e aggregata al solo fine di diagnosi tecnica." 
        }
      },
      dpa: {
        cards: { 
            crypto: { title: "Crittografia", body: "Tutti i dati in transito utilizzano il protocollo TLS 1.3. I dati a riposo (Database e Object Storage) sono protetti da crittografia AES-256." }, 
            access: { title: "Access Control", body: "Implementiamo rigorose policy di Row Level Security (RLS) a livello di database, garantendo che ogni medico possa accedere SOLO ai dati dei pazienti associati al proprio ID utente." } 
        },
        sec1: { 
            title: "1. Nomina a Responsabile (DPA)", 
            body: "Con l'accettazione dei presenti Termini di Servizio, l'Utente (Titolare) nomina Histyon come Responsabile del Trattamento (Data Processor) ai sensi dell'art. 28 del GDPR.\n\nHistyon si impegna a:\n- Trattare i dati personali solo su istruzione documentata del Titolare.\n- Garantire che le persone autorizzate al trattamento si siano impegnate alla riservatezza.\n- Adottare tutte le misure di sicurezza richieste dall'art. 32 del GDPR." 
        },
        sec2: { 
            title: "2. Misure di Sicurezza Tecniche", 
            body: "La sicurezza dei dati è garantita da un approccio 'Defense in Depth':\n\n- Autenticazione: Supporto per password complesse e gestione sicura delle sessioni.\n- Isolamento: I dati dei pazienti sono isolati logicamente tramite RLS.\n- Backup: Backup automatici giornalieri con retention policy definita.\n- Audit Log: Tracciamento di tutte le operazioni di upload, analisi e download effettuate sulla piattaforma." 
        }
      }
    }
  },
  validation: {
    passwordLength: "La password deve essere di almeno 8 caratteri",
    passwordComplexity: "Deve contenere almeno una lettera Maiuscola",
    passwordSpecial: "Deve contenere almeno un carattere speciale",
    passwordRegexMsg: "Inserire una maiuscola, numero e carattere speciale",
    passwordMismatch: "Le password non coincidono", 
    name: "Solo lettere", nameAllowed: "Solo lettere consentite",
    fiscalCodeLen: "16 car. alfanumerici", fiscalCodeFormat: "Formato errato",
    emailInvalid: "Email non valida", phoneShort: "Numero troppo corto",
    required: "Obbligatorio", genericError: "Si è verificato un errore imprevisto.", 
    alreadyRegistered: "Questa email è già registrata.",
    profileError: "Errore salvataggio profilo: ",
    patientExists: "Paziente già presente in archivio.",
    unauthorized: "Non autorizzato",
    dbError: "DB Error: ",
    uploadError: "Errore URL",
    cloudflareError: "Errore caricamento Cloudflare",
    networkError: "Errore di rete",
    fileNotFound: "Impossibile trovare il file nello storage.",
    fileRetrievalError: "Impossibile recuperare il file",
    credentialsInvalid: "Credenziali non valide",
    linkSent: "Link inviato correttamente",
    deletePatientError: "Errore durante l'eliminazione del paziente.",
    accountDeleted: "Account eliminato con successo.",
    passwordWrong: "Password non corretta. Riprova."
  }
}