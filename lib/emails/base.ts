/**
 * Template base Histyon per tutte le email transazionali.
 *
 * Varianti visive (accent):
 *   default  — strip grigio scuro   — email informative/neutre
 *   success  — strip verde          — approvazione, riattivazione
 *   warning  — strip ambra          — sospensione, azione consigliata
 *   danger   — strip rosso          — rifiuto, eliminazione, urgente
 *
 * Opzioni strutturali:
 *   topStrip      — barra colorata da 4px in cima all'email
 *   urgentBanner  — banner evidenziato subito dopo l'headline (action required)
 */

export type EmailAccent  = 'default' | 'success' | 'warning' | 'danger'

export type EmailSection =
  | { type: 'paragraph'; content: string }
  | { type: 'note';      content: string; accent?: EmailAccent }
  | { type: 'list';      items: string[] }
  | { type: 'cta';       text: string; href: string }
  | { type: 'divider' }
  | { type: 'spacer' }

// ─── Color maps ───────────────────────────────────────────────────────────────

const STRIP_COLOR: Record<EmailAccent, string> = {
  default: '#111827',
  success: '#059669',
  warning: '#d97706',
  danger:  '#dc2626',
}

const LABEL_COLOR: Record<EmailAccent, string> = {
  default: '#9ca3af',
  success: '#059669',
  warning: '#b45309',
  danger:  '#dc2626',
}

const BANNER_BG: Record<'warning' | 'danger', string> = {
  warning: '#fffbeb',
  danger:  '#fef2f2',
}
const BANNER_BORDER: Record<'warning' | 'danger', string> = {
  warning: '#fbbf24',
  danger:  '#fca5a5',
}
const BANNER_TEXT: Record<'warning' | 'danger', string> = {
  warning: '#78350f',
  danger:  '#991b1b',
}
const BANNER_ICON: Record<'warning' | 'danger', string> = {
  warning: '⚠',
  danger:  '🚨',
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function renderSection(s: EmailSection): string {
  switch (s.type) {
    case 'paragraph':
      return `<p style="margin:0 0 18px;font-size:15px;color:#4b5563;line-height:1.75;">${s.content}</p>`

    case 'note': {
      const a = s.accent ?? 'default'
      const borderColor = a === 'danger' ? '#fca5a5' : a === 'warning' ? '#fbbf24' : a === 'success' ? '#6ee7b7' : '#e5e7eb'
      const bgColor     = a === 'danger' ? '#fef7f7' : a === 'warning' ? '#fffdf0' : a === 'success' ? '#f0fdf4' : '#f9fafb'
      const textColor   = a === 'danger' ? '#7f1d1d' : a === 'warning' ? '#78350f' : a === 'success' ? '#065f46' : '#6b7280'
      return `<div style="border-left:3px solid ${borderColor};background:${bgColor};padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:${textColor};line-height:1.65;">${s.content}</p>
      </div>`
    }

    case 'list':
      return `<ul style="margin:0 0 24px;padding-left:20px;font-size:15px;color:#4b5563;line-height:2.2;">
        ${s.items.map(i => `<li style="margin-bottom:4px;">${i}</li>`).join('')}
      </ul>`

    case 'cta':
      return `<div style="margin:8px 0 32px;">
        <a href="${s.href}" style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;text-decoration:none;letter-spacing:0.03em;">${s.text}</a>
      </div>`

    case 'divider':
      return `<div style="border-top:1px solid #e5e7eb;margin:24px 0;"></div>`

    case 'spacer':
      return `<div style="height:12px;"></div>`
  }
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildEmail({
  label,
  headline,
  sections,
  accent      = 'default',
  topStrip    = false,
  urgentBanner,
}: {
  label:         string
  headline:      string
  sections:      EmailSection[]
  accent?:       EmailAccent
  topStrip?:     boolean
  urgentBanner?: { text: string; variant: 'warning' | 'danger' }
}): string {
  const body        = sections.map(renderSection).join('\n        ')
  const stripColor  = STRIP_COLOR[accent]
  const labelColor  = LABEL_COLOR[accent]
  const siteUrl     = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.histyon.com').replace(/\/$/, '')

  const topStripHtml = topStrip
    ? `<tr><td style="background:${stripColor};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>`
    : ''

  const urgentBannerHtml = urgentBanner
    ? `<div style="background:${BANNER_BG[urgentBanner.variant]};border:1px solid ${BANNER_BORDER[urgentBanner.variant]};padding:14px 18px;margin-bottom:28px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:${BANNER_TEXT[urgentBanner.variant]};line-height:1.5;">${BANNER_ICON[urgentBanner.variant]}&nbsp;&nbsp;${urgentBanner.text}</p>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
    <tr><td align="center" style="padding:48px 24px 48px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;">

        ${topStripHtml}

        <tr><td style="padding:40px 48px 0;">

          <!-- Logo -->
          <div style="padding-bottom:28px;">
            <img src="${siteUrl}/logo-black.png" width="32" height="32" alt="Histyon" style="display:block;" />
          </div>

          <!-- Divider -->
          <div style="border-top:1px solid #e5e7eb;margin-bottom:32px;"></div>

          <!-- Label + Headline -->
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:${labelColor};">${label}</p>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.02em;line-height:1.3;">${headline}</h1>

          ${urgentBannerHtml}

          <!-- Content -->
          ${body}

        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #e5e7eb;padding:24px 48px 36px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">
            Histyon · Diagnostica Medica Avanzata<br>
            <a href="${siteUrl}/legal/privacy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
            &nbsp;·&nbsp;
            <a href="${siteUrl}/legal/terms" style="color:#9ca3af;text-decoration:underline;">Termini di Servizio</a>
            &nbsp;·&nbsp;
            <a href="mailto:info@histyon.com" style="color:#9ca3af;text-decoration:underline;">info@histyon.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
