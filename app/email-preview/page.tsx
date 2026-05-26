/**
 * Pagina di anteprima email — solo sviluppo locale.
 * Naviga con ?t=0..6 per vedere ogni template.
 */

import {
  confirmSignupEmail,
  resetPasswordEmail,
  emailChangeEmail,
  reauthEmail,
  passwordChangedEmail,
  emailChangedEmail,
  accountDeletedEmail,
} from '@/lib/emails/auth'

const templates = [
  { label: 'Conferma registrazione',      ...confirmSignupEmail('https://histyon.com/auth/callback?token=EXAMPLE&type=signup') },
  { label: 'Reset password',              ...resetPasswordEmail('https://histyon.com/auth/callback?token=EXAMPLE&type=recovery') },
  { label: 'Conferma nuovo indirizzo',    ...emailChangeEmail('https://histyon.com/auth/callback?token=EXAMPLE&type=email_change', 'nuovo@esempio.com') },
  { label: 'Codice riautenticazione',     ...reauthEmail('847291') },
  { label: 'Password modificata',         ...passwordChangedEmail('Rossi') },
  { label: 'Email modificata (notifica)', ...emailChangedEmail('vecchio@esempio.com', 'Rossi') },
  { label: 'Account eliminato',           ...accountDeletedEmail('Bianchi') },
]

export default async function EmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const sp = await searchParams
  const idx = Math.min(Math.max(parseInt(sp.t ?? '0', 10) || 0, 0), templates.length - 1)
  const current = templates[idx]

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: '#f3f4f6', minHeight: '100vh' }}>

      {/* Top nav */}
      <div style={{ background: '#111827', padding: '12px 24px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>
          Email preview
        </span>
        {templates.map((t, i) => (
          <a
            key={i}
            href={`/email-preview?t=${i}`}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
              background: i === idx ? '#ffffff' : 'transparent',
              color:      i === idx ? '#111827' : '#9ca3af',
              border:     i === idx ? 'none' : '1px solid #374151',
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Subject bar */}
      <div style={{ background: '#1f2937', padding: '8px 24px' }}>
        <span style={{ color: '#6b7280', fontSize: 11 }}>Oggetto: </span>
        <span style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 500 }}>{current.subject}</span>
      </div>

      {/* Email render */}
      <div dangerouslySetInnerHTML={{ __html: current.html }} />
    </div>
  )
}
