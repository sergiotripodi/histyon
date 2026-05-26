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

// ── Approval-flow emails ──────────────────────────────────────────────────────

export function newDoctorAdminNotifyEmail(
  doctorName: string,
  doctorEmail: string,
  dashboardUrl: string,
): { subject: string; html: string } {
  return {
    subject: `Nuovo dottore in attesa di approvazione — ${doctorName}`,
    html: buildEmail({
      label:    'Nuova registrazione',
      headline: 'Un nuovo dottore si è registrato.',
      sections: [
        { type: 'paragraph', content: `<strong style="color:#111827;">${doctorName}</strong> (${doctorEmail}) ha completato la registrazione e il suo account è in attesa di approvazione.` },
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
        { type: 'paragraph', content: 'Abbiamo ricevuto la tua richiesta di accesso a Histyon. Il nostro team verificherà le tue credenziali mediche e ti risponderà <strong style="color:#111827;">entro 24 ore</strong>.' },
        { type: 'paragraph', content: 'Non è necessaria alcuna azione da parte tua in questo momento.' },
        { type: 'note', content: `Per qualsiasi informazione contattaci a ${SUPPORT}.` },
      ],
    }),
  }
}

export function accountApprovedEmail(doctorName: string, loginUrl: string): { subject: string; html: string } {
  return {
    subject: 'Il tuo account Histyon è stato approvato',
    html: buildEmail({
      label:    'Account approvato',
      headline: `Benvenuto su Histyon, ${doctorName}.`,
      sections: [
        { type: 'paragraph', content: 'Il tuo account è stato verificato e approvato dal team Histyon. Puoi ora accedere alla piattaforma e iniziare ad utilizzare tutti i servizi disponibili.' },
        { type: 'cta', text: 'Accedi alla piattaforma', href: loginUrl },
        { type: 'note', content: `Per assistenza scrivici a ${SUPPORT}.` },
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
    subject: 'Esito richiesta di accesso — Histyon',
    html: buildEmail({
      label:    'Richiesta non approvata',
      headline: `Gentile ${doctorName},`,
      sections: [
        { type: 'paragraph', content: 'Dopo aver esaminato la tua richiesta di accesso a Histyon, il nostro team non ha potuto approvare il tuo account per il seguente motivo:' },
        { type: 'note', content: `<strong style="color:#111827;">Motivo:</strong> ${reason}` },
        { type: 'paragraph', content: `Il tuo account e tutti i dati associati verranno eliminati automaticamente il <strong style="color:#111827;">${deletionDate}</strong>.` },
        { type: 'note', content: `Per chiarimenti o per richiedere una revisione scrivici a ${SUPPORT}.` },
      ],
    }),
  }
}

export function accountSuspendedEmail(doctorName: string, reason: string): { subject: string; html: string } {
  return {
    subject: 'Il tuo account Histyon è stato disattivato',
    html: buildEmail({
      label:    'Account disattivato',
      headline: `Gentile ${doctorName},`,
      sections: [
        { type: 'paragraph', content: 'Il tuo accesso alla piattaforma Histyon è stato temporaneamente disattivato dal team operativo per il seguente motivo:' },
        { type: 'note', content: `<strong style="color:#111827;">Motivo:</strong> ${reason}` },
        { type: 'paragraph', content: 'Non potrai accedere alla piattaforma fino a nuova comunicazione.' },
        { type: 'note', content: `Per richiedere informazioni o una revisione contattaci a ${SUPPORT}.` },
      ],
    }),
  }
}

export function accountReactivatedEmail(doctorName: string, loginUrl: string): { subject: string; html: string } {
  return {
    subject: 'Il tuo account Histyon è stato riattivato',
    html: buildEmail({
      label:    'Account riattivato',
      headline: `Bentornato, ${doctorName}.`,
      sections: [
        { type: 'paragraph', content: 'Il tuo account Histyon è stato riattivato. Puoi ora accedere nuovamente alla piattaforma e riprendere ad utilizzare tutti i servizi.' },
        { type: 'cta', text: 'Accedi alla piattaforma', href: loginUrl },
        { type: 'note', content: `Per assistenza scrivici a ${SUPPORT}.` },
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
