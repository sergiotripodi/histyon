/**
 * POST /api/auth/send-email
 *
 * Endpoint Auth Hook di Supabase per il tipo "send_email".
 * Sostituisce completamente il mailer nativo di Supabase:
 * quando Supabase deve inviare un'email di autenticazione, chiama questo
 * endpoint con il token già generato. Il codice costruisce il link e
 * invia tramite Resend SDK.
 *
 * Configurazione in Supabase:
 *   Dashboard → Authentication → Hooks → Send email
 *   → HTTPS Hook → URL: https://<tuo-dominio>/api/auth/send-email
 *   → Secret: valore di SUPABASE_HOOK_SECRET nelle env var
 *
 * Tipi gestiti (email_action_type):
 *   signup           → conferma email registrazione
 *   recovery         → reset password
 *   email_change     → conferma nuovo indirizzo email
 *   reauthentication → codice OTP per riautenticazione
 *
 * Sicurezza: Standard Webhooks (https://www.standardwebhooks.com/)
 *   Supabase invia webhook-id, webhook-timestamp, webhook-signature.
 *   HMAC-SHA256(decoded_key, id + "." + timestamp + "." + body)
 */

import { NextResponse }      from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { Resend }            from 'resend'
import {
  confirmSignupEmail,
  resetPasswordEmail,
  emailChangeEmail,
  reauthEmail,
} from '@/lib/emails/auth'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'Histyon <no-reply@histyon.com>'

// ── Hook authentication ───────────────────────────────────────────────────────

/**
 * Verifica la firma Standard Webhooks usata da Supabase Auth Hooks.
 *
 * Supabase invia:
 *   webhook-id:        ID univoco del messaggio
 *   webhook-timestamp: Unix timestamp (secondi)
 *   webhook-signature: "v1,<base64-HMAC-SHA256>"  (possono essere più, spazio-separated)
 *
 * HMAC = SHA256( Buffer.from(whsecPart,'base64'), id + "." + ts + "." + body )
 * dove secret ha formato "v1,whsec_<whsecPart>"
 *
 * Fallback JWT HS256 e Bearer diretto per compatibilità con versioni diverse.
 */
function verifyHookSecret(headers: Headers, rawBody: string, rawSecret: string): boolean {
  const secret = rawSecret.trim()
  const whId   = headers.get('webhook-id')        ?? ''
  const whTs   = headers.get('webhook-timestamp') ?? ''
  const whSig  = headers.get('webhook-signature') ?? ''
  const authHdr = headers.get('authorization')    ?? ''

  // ── Standard Webhooks ─────────────────────────────────────────────────────
  if (whId && whTs && whSig) {
    const m = secret.match(/(?:^|,)whsec_([A-Za-z0-9+/=_\-]+)/)
    if (!m?.[1]) return false

    const key      = Buffer.from(m[1], 'base64')
    const payload  = `${whId}.${whTs}.${rawBody}`
    const expected = createHmac('sha256', key).update(payload).digest('base64')

    for (const sig of whSig.split(' ')) {
      const sigVal = sig.startsWith('v1,') ? sig.slice(3) : sig
      try {
        const a = Buffer.from(expected, 'base64')
        const b = Buffer.from(sigVal,   'base64')
        if (a.length === b.length && timingSafeEqual(a, b)) return true
      } catch { /* firma malformata */ }
    }
    return false
  }

  // ── Fallback: Bearer diretto ──────────────────────────────────────────────
  if (authHdr === `Bearer ${secret}`) return true

  // ── Fallback: JWT HS256 ───────────────────────────────────────────────────
  const token = authHdr.startsWith('Bearer ') ? authHdr.slice(7) : authHdr
  const parts = token.split('.')
  if (parts.length === 3) {
    const tryKey = (key: Buffer): boolean => {
      try {
        const expected = createHmac('sha256', key)
          .update(`${parts[0]}.${parts[1]}`)
          .digest('base64url')
        const strip = (s: string) => s.replace(/=+$/, '')
        const a = Buffer.from(strip(expected))
        const b = Buffer.from(strip(parts[2]))
        if (a.length !== b.length) return false
        return timingSafeEqual(a, b)
      } catch { return false }
    }
    if (tryKey(Buffer.from(secret, 'utf8'))) return true
    const m2 = secret.match(/(?:^|,)whsec_([A-Za-z0-9+/=_\-]+)/)
    if (m2?.[1]) {
      if (tryKey(Buffer.from(m2[1], 'base64')))    return true
      if (tryKey(Buffer.from(m2[1], 'base64url'))) return true
    }
  }

  return false
}

// ── Link builder ──────────────────────────────────────────────────────────────

function buildVerifyUrl(tokenHash: string, type: string, redirectTo: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const rawBody    = await req.text()
  const hookSecret = process.env.SUPABASE_HOOK_SECRET?.trim()

  if (hookSecret && !verifyHookSecret(req.headers, rawBody, hookSecret)) {
    console.error('[send-email hook] unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const user       = payload?.user
  const emailData  = payload?.email_data
  const actionType = emailData?.email_action_type as string | undefined
  const to         = user?.email as string | undefined

  if (!to || !actionType || !emailData) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const tokenHash  = emailData.token_hash  as string ?? ''
  const redirectTo = emailData.redirect_to as string ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const confirmUrl = buildVerifyUrl(tokenHash, actionType, redirectTo)

  let email: { subject: string; html: string } | null = null

  switch (actionType) {
    case 'signup':
      email = confirmSignupEmail(confirmUrl)
      break
    case 'recovery':
      email = resetPasswordEmail(confirmUrl)
      break
    case 'email_change':
      email = emailChangeEmail(confirmUrl, to)
      break
    case 'reauthentication':
      email = reauthEmail(emailData.token as string ?? '')
      break
    default:
      console.warn('[send-email hook] tipo non gestito:', actionType)
      return NextResponse.json({ ok: true, warning: `unhandled type: ${actionType}` })
  }

  try {
    await resend.emails.send({ from: FROM, to, subject: email.subject, html: email.html })
  } catch (err) {
    console.error('[send-email hook] errore Resend:', err)
    return NextResponse.json({ ok: false, error: 'send failed' }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
