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
 *   passwordChanged   → notifica cambio password avvenuto
 *   emailChanged      → notifica cambio email avvenuto (alla vecchia email)
 *   accountDeleted    → account eliminato (vedi lib/email.ts)
 */

import { buildEmail } from './base'

const SUPPORT = '<a href="mailto:info@histyon.com" style="color:#374151;font-weight:500;">info@histyon.com</a>'

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
        { type: 'note', content: `Se non hai creato un account Histyon, ignora questa email.` },
      ],
    }),
  }
}

export function resetPasswordEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Reimposta la tua password - Histyon',
    html: buildEmail({
      label:    'Sicurezza account',
      headline: 'Hai richiesto un nuovo accesso.',
      sections: [
        { type: 'paragraph', content: 'Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account Histyon. Clicca il pulsante qui sotto per scegliere una nuova password.' },
        { type: 'paragraph', content: 'Il link è valido per 1 ora. Se scade, torna alla pagina di login e richiedi un nuovo link.' },
        { type: 'cta', text: 'Reimposta password', href: resetUrl },
        { type: 'note', content: `Se non hai richiesto il reset della password, puoi ignorare questa email. Il tuo account è al sicuro.` },
      ],
    }),
  }
}

export function emailChangeEmail(confirmUrl: string, newEmail: string): { subject: string; html: string } {
  return {
    subject: 'Conferma il nuovo indirizzo email - Histyon',
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
        { type: 'paragraph', content: `<span style="font-size:32px;font-weight:700;letter-spacing:0.12em;color:#111827;">${otp}</span>` },
        { type: 'paragraph', content: 'Il codice è valido per 10 minuti.' },
        { type: 'note', content: `Se non hai richiesto questo codice, ignora questa email oppure contatta il supporto a ${SUPPORT}.` },
      ],
    }),
  }
}

// ── Notification emails (inviate dal codice, non dall'hook) ───────────────────

export function passwordChangedEmail(name?: string): { subject: string; html: string } {
  const displayName = name ? `Dr. ${name}` : 'Dottore'
  return {
    subject: 'La tua password è stata modificata - Histyon',
    html: buildEmail({
      label:    'Sicurezza account',
      headline: 'Password aggiornata.',
      sections: [
        { type: 'paragraph', content: `Ciao ${displayName}, la password del tuo account Histyon è stata modificata con successo.` },
        { type: 'note', content: `Se non sei stato tu a effettuare questa modifica, contatta immediatamente il supporto a ${SUPPORT}.` },
      ],
    }),
  }
}

export function emailChangedEmail(oldEmail: string, name?: string): { subject: string; html: string } {
  const displayName = name ? `Dr. ${name}` : 'Dottore'
  return {
    subject: 'Il tuo indirizzo email è stato aggiornato - Histyon',
    html: buildEmail({
      label:    'Sicurezza account',
      headline: 'Email aggiornata.',
      sections: [
        { type: 'paragraph', content: `Ciao ${displayName}, il tuo indirizzo email su Histyon è stato aggiornato con successo. Questo avviso è stato inviato al vecchio indirizzo <strong style="color:#111827;">${oldEmail}</strong>.` },
        { type: 'note', content: `Se non sei stato tu a richiedere questa modifica, contatta immediatamente il supporto a ${SUPPORT}.` },
      ],
    }),
  }
}

export function accountDeletedEmail(name?: string): { subject: string; html: string } {
  const displayName = name ? `Dr. ${name}` : 'Dottore'
  return {
    subject: 'Il tuo account Histyon è stato eliminato',
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
        { type: 'note', content: `Se non sei stato tu a richiedere questa eliminazione, contattaci immediatamente a ${SUPPORT}.` },
      ],
    }),
  }
}
