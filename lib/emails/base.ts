/**
 * Template base Histyon per tutte le email transazionali.
 * Logo → divider → label + headline → sezioni → footer.
 */

export type EmailSection =
  | { type: 'paragraph'; content: string }
  | { type: 'note';      content: string }
  | { type: 'list';      items: string[] }
  | { type: 'cta';       text: string; href: string }
  | { type: 'spacer' }

function renderSection(s: EmailSection): string {
  switch (s.type) {
    case 'paragraph':
      return `<p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.7;">${s.content}</p>`

    case 'note':
      return `<div style="border-left:3px solid #e5e7eb;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">${s.content}</p>
      </div>`

    case 'list':
      return `<ul style="margin:0 0 24px;padding-left:20px;font-size:15px;color:#4b5563;line-height:2.2;">
        ${s.items.map(i => `<li>${i}</li>`).join('')}
      </ul>`

    case 'cta':
      return `<div style="margin-bottom:32px;">
        <a href="${s.href}" style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;padding:14px 28px;text-decoration:none;letter-spacing:0.01em;">${s.text}</a>
      </div>`

    case 'spacer':
      return `<div style="height:16px;"></div>`
  }
}

export function buildEmail({
  label,
  headline,
  sections,
}: {
  label:    string
  headline: string
  sections: EmailSection[]
}): string {
  const body = sections.map(renderSection).join('\n        ')

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:48px 24px 0;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px;">
          <img src="https://www.histyon.com/logo-black.png" width="36" height="36" alt="Histyon" style="display:block;" />
        </td></tr>

        <!-- Divider -->
        <tr><td style="border-top:1px solid #e5e7eb;padding-bottom:32px;"></td></tr>

        <!-- Label + Headline -->
        <tr><td style="padding-bottom:4px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">${label}</p>
          <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.02em;">${headline}</h1>
        </td></tr>

        <!-- Content sections -->
        <tr><td>
        ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #e5e7eb;padding:28px 0 48px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            Histyon · Diagnostica Medica Avanzata<br>
            <a href="https://www.histyon.com/legal/privacy" style="color:#9ca3af;text-decoration:none;">Privacy Policy</a>
            &nbsp;·&nbsp;
            <a href="https://www.histyon.com/legal/terms" style="color:#9ca3af;text-decoration:none;">Termini di Servizio</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
