import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Histyon <noreply@histyon.com>'

export async function sendAccountDeletedEmail(to: string, name: string) {
  if (!resend) return

  const displayName = name ? `Dr. ${name}` : to.split('@')[0]

  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Account eliminato</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:48px 24px 0;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px;">
          <img src="https://www.histyon.com/logo-black.png" width="36" height="36" alt="Histyon" style="display:block;" />
        </td></tr>

        <!-- Divider -->
        <tr><td style="border-top:1px solid #e5e7eb;padding-bottom:32px;"></td></tr>

        <!-- Content -->
        <tr><td>
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">Histyon Console</p>
          <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Ci dispiace vederti andare, ${displayName}.</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.7;">
            Il tuo account Histyon è stato eliminato con successo, come da tua richiesta.
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.7;">
            Sono stati rimossi permanentemente dai nostri server:
          </p>
          <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;color:#4b5563;line-height:2;">
            <li>Il tuo profilo medico e dati account</li>
            <li>Tutti i pazienti registrati</li>
            <li>Tutte le analisi e i ticket</li>
            <li>Tutti i file e le immagini archiviate</li>
          </ul>
          <p style="margin:0 0 32px;font-size:15px;color:#4b5563;line-height:1.7;">
            Se vuoi tornare in futuro, potrai sempre creare un nuovo account su <a href="https://www.histyon.com" style="color:#111827;font-weight:600;">histyon.com</a>.
          </p>
          <div style="border-left:3px solid #e5e7eb;padding:12px 16px;margin-bottom:32px;">
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
              Se non sei stato tu a richiedere questa eliminazione, contattaci immediatamente a <a href="mailto:info@histyon.com" style="color:#111827;">info@histyon.com</a>.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #e5e7eb;padding:28px 0 48px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            Histyon · Diagnostica Medica Avanzata<br>
            <a href="https://www.histyon.com/legal/privacy" style="color:#9ca3af;">Privacy Policy</a> ·
            <a href="https://www.histyon.com/legal/terms" style="color:#9ca3af;">Termini di Servizio</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Il tuo account Histyon è stato eliminato',
    html,
  })
}
