/**
 * Template email auth Histyon.
 *
 * Ogni funzione riceve i dati dinamici e restituisce { subject, html }.
 * L'HTML è costruito tramite buildEmail() da lib/emails/base.ts.
 *
 * Tipi gestiti dall'Auth Hook Supabase send_email:
 *   signup            → conferma email al momento della registrazione
 *   recovery          → reset password
 *   email_change      → conferma nuovo indirizzo email (alla nuova email)
 *   reauthentication  → codice OTP per riautenticazione
 *
 * Email custom inviate dal codice:
 *   passwordChanged         → notifica cambio password avvenuto
 *   emailChanged            → notifica cambio email (alla vecchia email)
 *   accountDeleted          → eliminazione volontaria completata
 *   accountApproved         → account approvato dall'admin
 *   accountRejected         → registrazione rifiutata + data eliminazione
 *   accountSuspended        → account sospeso + data eliminazione programmata
 *   accountReactivated      → account riattivato
 *   accountDeletionWarning  → avviso 7 giorni prima dell'eliminazione automatica
 *   accountAutoDeleted      → conferma GDPR eliminazione automatica
 */

import { buildEmail } from './base'

const SUPPORT      = '<a href="mailto:info@histyon.com" style="color:#374151;font-weight:600;">info@histyon.com</a>'
const SUPPORT_HREF = 'mailto:info@histyon.com'

// ── Auth Hook emails ──────────────────────────────────────────────────────────

export function confirmSignupEmail(confirmUrl: string): { subject: string; html: string } {
  return {
    subject: 'Conferma il tuo account Histyon',
    html: buildEmail({
      label:    'Conferma account',
      headline: 'Benvenuto su Histyon.',
      sections: [
        { type: 'paragraph', content: 'Grazie per esserti registrato. Per completare la creazione del tuo account, conferma il tuo indirizzo email cliccando sul pulsante qui sotto.' },
        { type: 'paragraph', content: 'Il link è valido per 24 ore.' },
        { type: 'cta', text: 'Conferma email', href: confirmUrl },
        { type: 'note', content: 'Se non hai creato un account Histyon, ignora questa email.' },
      ],
    }),
  }
}

export function resetPasswordEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Reimposta la password — Histyon',
    html: buildEmail({
      label:    'Sicurezza account',
      headline: 'Hai richiesto il reset della password.',
      sections: [
        { type: 'paragraph', content: 'Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account Histyon. Clicca il pulsante qui sotto per scegliere una nuova password.' },
        { type: 'paragraph', content: 'Il link è valido per <strong style="color:#111827;">1 ora</strong>. Se scade, torna alla pagina di login e richiedi un nuovo link.' },
        { type: 'cta', text: 'Reimposta password', href: resetUrl },
        { type: 'note', content: `Se non hai richiesto il reset della password, ignora questa email. Il tuo account è al sicuro. Per dubbi scrivici a ${SUPPORT}.` },
      ],
    }),
  }
}

export function emailChangeEmail(confirmUrl: string, newEmail: string): { subject: string; html: string } {
  return {
    subject: 'Conferma il nuovo indirizzo email — Histyon',
    html: buildEmail({
      label:    'Modifica email',
      headline: 'Conferma il tuo nuovo indirizzo.',
      sections: [
        { type: 'paragraph', content: `Hai richiesto di aggiornare il tuo indirizzo email su Histyon. Clicca il pulsante qui sotto per confermare il nuovo indirizzo <strong style="color:#111827;">${newEmail}</strong>.` },
        { type: 'paragraph', content: 'Il link è valido per 24 ore.' },
        { type: 'cta', text: 'Conferma nuovo indirizzo', href: confirmUrl },
        { type: 'note', content: `Se non hai richiesto questa modifica, contatta subito il supporto a ${SUPPORT}.` },
      ],
    }),
  }
}

export function reauthEmail(otp: string): { subject: string; html: string } {
  return {
    subject: 'Codice di conferma Histyon',
    html: buildEmail({
      label:    'Verifica identità',
      headline: 'Inserisci il codice di conferma.',
      sections: [
        { type: 'paragraph', content: 'Hai richiesto di riautenticare il tuo account Histyon. Inserisci il codice qui sotto nella pagina aperta.' },
        { type: 'paragraph', content: `<span style="display:inline-block;font-size:34px;font-weight:700;letter-spacing:0.18em;color:#111827;background:#f3f4f6;padding:12px 20px;margin:4px 0 8px;">${otp}</span>` },
        { type: 'paragraph', content: 'Il codice è valido per <strong style="color:#111827;">10 minuti</strong>.' },
        { type: 'note', content: `Se non hai richiesto questo codice, ignora questa email oppure contatta il supporto a ${SUPPORT}.` },
      ],
    }),
  }
}

// ── Notification emails ───────────────────────────────────────────────────────

export function passwordChangedEmail(name?: string): { subject: string; html: string } {
  const displayName = name ? `Dr. ${name}` : 'Dottore'
  return {
    subject: 'La tua password è stata modificata — Histyon',
    html: buildEmail({
      label:    'Sicurezza account',
      headline: 'Password aggiornata con successo.',
      sections: [
        { type: 'paragraph', content: `Ciao ${displayName}, la password del tuo account Histyon è stata modificata con successo.` },
        { type: 'paragraph', content: 'Se sei stato tu, non è necessaria alcuna azione.' },
        { type: 'note', accent: 'danger', content: `Se <strong>non</strong> sei stato tu a effettuare questa modifica, accedi immediatamente alla piattaforma e cambia la password, oppure contatta il supporto a ${SUPPORT}.` },
      ],
    }),
  }
}

export function emailChangedEmail(oldEmail: string, name?: string): { subject: string; html: string } {
  const displayName = name ? `Dr. ${name}` : 'Dottore'
  return {
    subject: 'Il tuo indirizzo email è stato aggiornato — Histyon',
    html: buildEmail({
      label:    'Sicurezza account',
      headline: 'Email aggiornata.',
      sections: [
        { type: 'paragraph', content: `Ciao ${displayName}, il tuo indirizzo email su Histyon è stato aggiornato con successo. Questo avviso è stato inviato al vecchio indirizzo <strong style="color:#111827;">${oldEmail}</strong>.` },
        { type: 'note', accent: 'danger', content: `Se <strong>non</strong> sei stato tu a richiedere questa modifica, contatta immediatamente il supporto a ${SUPPORT}.` },
      ],
    }),
  }
}

// ── Approval-flow emails ──────────────────────────────────────────────────────

export function newDoctorAdminNotifyEmail(
  doctorName: string,
  doctorEmail: string,
  dashboardUrl: string,
): { subject: string; html: string } {
  return {
    subject: `Nuova registrazione in attesa — ${doctorName}`,
    html: buildEmail({
      label:    'Nuova registrazione',
      headline: 'Un nuovo dottore si è registrato.',
      sections: [
        { type: 'paragraph', content: `<strong style="color:#111827;">${doctorName}</strong> (${doctorEmail}) ha completato la registrazione ed è in attesa di approvazione.` },
        { type: 'cta', text: 'Vai alla Dashboard Admin', href: dashboardUrl },
        { type: 'note', content: 'Dalla dashboard puoi approvare o rifiutare l\'account nella sezione Dati utenti.' },
      ],
    }),
  }
}

export function registrationPendingEmail(doctorName: string): { subject: string; html: string } {
  return {
    subject: 'Registrazione ricevuta — Histyon',
    html: buildEmail({
      label:    'In attesa di approvazione',
      headline: `Grazie, ${doctorName}. Ci siamo quasi.`,
      sections: [
        { type: 'paragraph', content: 'Abbiamo ricevuto la tua richiesta di accesso a Histyon. Il nostro team verificherà le tue credenziali mediche e ti risponderà <strong style="color:#111827;">entro 24 ore lavorative</strong>.' },
        { type: 'paragraph', content: 'Non è necessaria alcuna azione da parte tua in questo momento.' },
        { type: 'note', content: `Per qualsiasi informazione contattaci a ${SUPPORT}.` },
      ],
    }),
  }
}

export function accountApprovedEmail(doctorName: string, loginUrl: string): { subject: string; html: string } {
  return {
    subject: '✓ Il tuo account Histyon è stato approvato',
    html: buildEmail({
      accent:   'success',
      topStrip: true,
      label:    'Account approvato',
      headline: `Benvenuto su Histyon, ${doctorName}.`,
      sections: [
        { type: 'paragraph', content: 'Il tuo account è stato verificato e approvato dal team Histyon. Puoi ora accedere alla piattaforma e iniziare ad utilizzare tutti i servizi disponibili.' },
        { type: 'cta', text: 'Accedi alla piattaforma', href: loginUrl },
        { type: 'note', accent: 'success', content: `Per assistenza scrivici a ${SUPPORT}.` },
      ],
    }),
  }
}

export function accountRejectedEmail(
  doctorName: string,
  reason: string,
  deletionDate: string,
): { subject: string; html: string } {
  return {
    subject: '⛔ Richiesta di accesso non approvata — Histyon',
    html: buildEmail({
      accent:       'danger',
      topStrip:     true,
      label:        'Accesso non approvato',
      headline:     `Gentile ${doctorName},`,
      urgentBanner: {
        variant: 'danger',
        text:    `Il tuo account e tutti i dati verranno eliminati il ${deletionDate}`,
      },
      sections: [
        { type: 'paragraph', content: 'Dopo aver esaminato la tua richiesta di accesso a Histyon, il nostro team non ha potuto approvare il tuo account per il seguente motivo:' },
        { type: 'note', accent: 'danger', content: `<strong>Motivo:</strong> ${reason}` },
        { type: 'paragraph', content: `In conformità alla nostra policy sulla conservazione dei dati (GDPR Art. 17), il tuo account e tutti i dati associati verranno <strong style="color:#dc2626;">eliminati automaticamente il ${deletionDate}</strong>.` },
        { type: 'divider' },
        { type: 'paragraph', content: `Se ritieni che questa decisione sia un errore o desideri richiedere una revisione, scrivi a <a href="${SUPPORT_HREF}" style="color:#111827;font-weight:600;">info@histyon.com</a> entro il <strong style="color:#111827;">${deletionDate}</strong>.` },
        { type: 'note', content: 'Questa email è inviata in conformità al GDPR Art. 17 (diritto alla cancellazione).' },
      ],
    }),
  }
}

export function accountSuspendedEmail(
  doctorName: string,
  reason: string,
): { subject: string; html: string } {
  return {
    subject: '⚠ Il tuo account Histyon è stato disattivato',
    html: buildEmail({
      accent:       'warning',
      topStrip:     true,
      label:        'Account disattivato',
      headline:     `Gentile ${doctorName},`,
      urgentBanner: {
        variant: 'warning',
        text:    'Per richiedere la riattivazione scrivi a info@histyon.com',
      },
      sections: [
        { type: 'paragraph', content: 'Il tuo accesso alla piattaforma Histyon è stato <strong style="color:#111827;">temporaneamente disattivato</strong> dal team operativo per il seguente motivo:' },
        { type: 'note', accent: 'warning', content: `<strong>Motivo della disattivazione:</strong> ${reason}` },
        { type: 'paragraph', content: 'Non potrai accedere alla piattaforma fino a nuova comunicazione da parte del team Histyon.' },
        { type: 'divider' },
        { type: 'paragraph', content: `<strong style="color:#111827;">Come richiedere la riattivazione:</strong><br>Scrivi a <a href="${SUPPORT_HREF}" style="color:#111827;font-weight:600;">info@histyon.com</a> indicando il tuo nome completo e la tua email. Il team valuterà la tua richiesta entro <strong style="color:#111827;">48 ore lavorative</strong>.` },
        { type: 'note', content: 'Se ritieni che la disattivazione sia avvenuta per errore, contattaci immediatamente.' },
      ],
    }),
  }
}

export function accountReactivatedEmail(doctorName: string, loginUrl: string): { subject: string; html: string } {
  return {
    subject: '✓ Il tuo account Histyon è stato riattivato',
    html: buildEmail({
      accent:   'success',
      topStrip: true,
      label:    'Account riattivato',
      headline: `Bentornato, ${doctorName}.`,
      sections: [
        { type: 'paragraph', content: 'Il tuo account Histyon è stato <strong style="color:#059669;">riattivato</strong>. Puoi ora accedere nuovamente alla piattaforma e riprendere ad utilizzare tutti i servizi.' },
        { type: 'cta', text: 'Accedi alla piattaforma', href: loginUrl },
        { type: 'note', accent: 'success', content: `Per assistenza scrivici a ${SUPPORT}.` },
      ],
    }),
  }
}

export function accountDeletedEmail(name?: string): { subject: string; html: string } {
  const displayName = name ? `Dr. ${name}` : 'Dottore'
  return {
    subject: 'Il tuo account Histyon è stato eliminato — Conferma',
    html: buildEmail({
      label:    'Account eliminato',
      headline: `Ci dispiace vederti andare, ${displayName}.`,
      sections: [
        { type: 'paragraph', content: 'Il tuo account Histyon è stato eliminato con successo, come da tua richiesta.' },
        { type: 'paragraph', content: 'Sono stati rimossi permanentemente dai nostri server:' },
        { type: 'list', items: [
          'Il tuo profilo medico e dati account',
          'Tutti i pazienti registrati',
          'Tutte le analisi e i ticket',
          'Tutti i file e le immagini archiviate',
        ]},
        { type: 'paragraph', content: `Se vuoi tornare in futuro, potrai sempre creare un nuovo account su <a href="https://www.histyon.com" style="color:#111827;font-weight:600;">histyon.com</a>.` },
        { type: 'note', accent: 'danger', content: `Se <strong>non</strong> sei stato tu a richiedere questa eliminazione, contattaci immediatamente a ${SUPPORT}.` },
      ],
    }),
  }
}

// ── Deletion lifecycle emails ─────────────────────────────────────────────────

export function accountDeletionWarningEmail(
  doctorName: string,
  deletionDate: string,
  reason: 'rejected' | 'suspended_expired',
): { subject: string; html: string } {
  const isRejected = reason === 'rejected'
  return {
    subject: `🚨 URGENTE: Il tuo account Histyon sarà eliminato il ${deletionDate}`,
    html: buildEmail({
      accent:       'danger',
      topStrip:     true,
      label:        'Avviso eliminazione — 7 giorni',
      headline:     `Gentile ${doctorName},`,
      urgentBanner: {
        variant: 'danger',
        text:    `AZIONE RICHIESTA — Il tuo account sarà eliminato definitivamente il ${deletionDate}`,
      },
      sections: [
        {
          type:    'paragraph',
          content: isRejected
            ? `Ti ricordiamo che la tua richiesta di accesso a Histyon non è stata approvata. In conformità alla nostra policy (GDPR Art. 17), tra <strong style="color:#dc2626;">7 giorni</strong> il tuo account e tutti i dati associati verranno eliminati definitivamente.`
            : `Ti ricordiamo che il tuo account Histyon è disattivato dal team operativo. In conformità alla nostra policy (GDPR Art. 5), tra <strong style="color:#dc2626;">7 giorni</strong> il tuo account e tutti i dati associati verranno eliminati definitivamente.`,
        },
        { type: 'paragraph', content: 'Verranno eliminati definitivamente:' },
        { type: 'list', items: [
          'Il tuo profilo medico e dati account',
          'Tutti i pazienti registrati',
          'Tutte le analisi e i ticket',
          'Tutti i file e le immagini archiviate',
        ]},
        { type: 'divider' },
        {
          type:    'paragraph',
          content: isRejected
            ? `Per contestare questa decisione o richiedere maggiori informazioni, scrivi a <a href="${SUPPORT_HREF}" style="color:#111827;font-weight:600;">info@histyon.com</a> <strong style="color:#dc2626;">prima del ${deletionDate}</strong>.`
            : `Per evitare l'eliminazione e richiedere la riattivazione del tuo account, scrivi a <a href="${SUPPORT_HREF}" style="color:#111827;font-weight:600;">info@histyon.com</a> <strong style="color:#dc2626;">prima del ${deletionDate}</strong>. Il team valuterà la tua richiesta entro 48 ore lavorative.`,
        },
        { type: 'note', accent: 'danger', content: `<strong>Attenzione:</strong> dopo il ${deletionDate} non sarà più possibile recuperare i tuoi dati. L'eliminazione è irreversibile.` },
        { type: 'spacer' },
        { type: 'note', content: 'Avviso inviato in conformità al GDPR Art. 17 e Art. 5, par. 1, lett. e — limitazione della conservazione.' },
      ],
    }),
  }
}

export function accountAutoDeletedEmail(
  doctorName: string,
  reason: 'rejected' | 'suspended_expired',
): { subject: string; html: string } {
  const isRejected = reason === 'rejected'
  return {
    subject: 'Conferma eliminazione account Histyon — Ricevuta GDPR',
    html: buildEmail({
      accent:   'danger',
      topStrip: true,
      label:    'Account eliminato definitivamente',
      headline: `Gentile ${doctorName},`,
      sections: [
        {
          type:    'paragraph',
          content: isRejected
            ? 'Il tuo account Histyon e tutti i dati associati sono stati <strong style="color:#dc2626;">eliminati definitivamente</strong> al termine del periodo di conservazione previsto dalla nostra policy (30 giorni dalla notifica di rifiuto, GDPR Art. 17).'
            : 'Il tuo account Histyon e tutti i dati associati sono stati <strong style="color:#dc2626;">eliminati definitivamente</strong> al termine del periodo di sospensione previsto dalla nostra policy (90 giorni, GDPR Art. 5, par. 1, lett. e).',
        },
        { type: 'paragraph', content: 'Sono stati rimossi permanentemente dai nostri server:' },
        { type: 'list', items: [
          'Il tuo profilo medico e dati account',
          'Tutti i pazienti registrati',
          'Tutte le analisi e i ticket',
          'Tutti i file e le immagini archiviate',
          'Tutti i log di accesso e attività',
        ]},
        { type: 'divider' },
        { type: 'paragraph', content: `Per domande o se ritieni che l'eliminazione sia avvenuta per errore, scrivi a <a href="${SUPPORT_HREF}" style="color:#111827;font-weight:600;">info@histyon.com</a>.` },
        { type: 'note', content: 'Questa email costituisce la <strong>ricevuta ufficiale di cancellazione dei tuoi dati personali</strong> ai sensi del GDPR Art. 17 e del D.Lgs. 196/2003. Conservala per eventuali necessità future.' },
      ],
    }),
  }
}
