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
 * Sicurezza: verifica JWT HS256 firmato con SUPABASE_HOOK_SECRET.
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
// Supabase Auth Hooks firmano la richiesta con un JWT HS256 il cui secret
// è i byte grezzi ottenuti decodificando in base64 la parte dopo "whsec_".
// Formato secret Supabase: "v1,whsec_<base64-encoded-key>"

/**
 * Verifica la firma Standard Webhooks (https://www.standardwebhooks.com/)
 * usata da Supabase Auth Hooks.
 *
 * Supabase invia:
 *   webhook-id:        ID univoco del messaggio
 *   webhook-timestamp: Unix timestamp (secondi)
 *   webhook-signature: "v1,<base64-HMAC-SHA256>"
 *
 * HMAC = SHA256( decodedKey, webhookId + "." + timestamp + "." + rawBody )
 * decodedKey = Buffer.from( whsecPart, 'base64' )  dove secret = "v1,whsec_<whsecPart>"
 */
function checkHookSecret(
  headers: Headers,
  rawBody: string,
  rawSecret: string,
): { ok: boolean; diag: Record<string, unknown> } {
  const secret  = rawSecret.trim()
  const whId    = headers.get('webhook-id')        ?? ''
  const whTs    = headers.get('webhook-timestamp') ?? ''
  const whSig   = headers.get('webhook-signature') ?? ''
  // fallback: alcuni header vengono inviati in lowercase senza il prefisso "webhook-"
  const authHdr = headers.get('authorization')     ?? ''

  const diag: Record<string, unknown> = {
    sLen: secret.length,
    sFmt: secret.startsWith('v1,whsec_') ? 'v1,whsec_' : secret.slice(0, 8),
    whId:  whId  ? whId.slice(0, 12) + '…'  : '(empty)',
    whTs,
    whSig: whSig ? whSig.slice(0, 20) + '…' : '(empty)',
    authHdr: authHdr ? authHdr.slice(0, 20) + '…' : '(empty)',
    result: 'pending',
  }

  // ── Standard Webhooks (percorso principale) ───────────────────────────────
  if (whId && whTs && whSig) {
    const m = secret.match(/(?:^|,)whsec_([A-Za-z0-9+/=_\-]+)/)
    if (!m?.[1]) { diag.result = 'no_whsec_in_secret'; return { ok: false, diag } }

    const key      = Buffer.from(m[1], 'base64')
    const payload  = `${whId}.${whTs}.${rawBody}`
    const expected = createHmac('sha256', key).update(payload).digest('base64')

    // webhook-signature può contenere più firme separate da spazi ("v1,xxx v1,yyy")
    const sigs = whSig.split(' ')
    for (const sig of sigs) {
      const sigVal = sig.startsWith('v1,') ? sig.slice(3) : sig
      try {
        const a = Buffer.from(expected,        'base64')
        const b = Buffer.from(sigVal,          'base64')
        if (a.length === b.length && timingSafeEqual(a, b)) {
          diag.result = 'standard_webhooks_OK'
          return { ok: true, diag }
        }
      } catch { /* firma malformata, prova la prossima */ }
    }
    diag.result = 'standard_webhooks_sig_mismatch'
    return { ok: false, diag }
  }

  // ── Fallback: Bearer diretto (alcune versioni Supabase) ──────────────────
  if (authHdr === `Bearer ${secret}`) {
    diag.result = 'bearer_direct_OK'
    return { ok: true, diag }
  }

  // ── Fallback: JWT HS256 nell'Authorization header ─────────────────────────
  const token = authHdr.startsWith('Bearer ') ? authHdr.slice(7) : authHdr
  const parts = token.split('.')
  if (parts.length === 3) {
    const tryKey = (key: Buffer, label: string): boolean => {
      try {
        const expected = createHmac('sha256', key)
          .update(`${parts[0]}.${parts[1]}`)
          .digest('base64url')
        const strip = (s: string) => s.replace(/=+$/, '')
        const a = Buffer.from(strip(expected))
        const b = Buffer.from(strip(parts[2]))
        if (a.length !== b.length) { diag.result = `jwt_lenMismatch_${label}`; return false }
        const ok = timingSafeEqual(a, b)
        if (ok) diag.result = `jwt_OK_${label}`
        else    diag.result = `jwt_sig_mismatch_${label}`
        return ok
      } catch (e) {
        diag.result = `jwt_err_${label}`; return false
      }
    }
    if (tryKey(Buffer.from(secret, 'utf8'), 'raw'))      return { ok: true, diag }
    const m2 = secret.match(/(?:^|,)whsec_([A-Za-z0-9+/=_\-]+)/)
    if (m2?.[1]) {
      if (tryKey(Buffer.from(m2[1], 'base64'),    'wb64'))    return { ok: true, diag }
      if (tryKey(Buffer.from(m2[1], 'base64url'), 'wb64url')) return { ok: true, diag }
    }
  }

  diag.result = `no_auth_whId=${!!whId}_whSig=${!!whSig}_authLen=${authHdr.length}`
  return { ok: false, diag }
}

// ── Link builder ──────────────────────────────────────────────────────────────

function buildVerifyUrl(tokenHash: string, type: string, redirectTo: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Leggi il body come stringa prima — serve sia per la firma Standard Webhooks
  // sia per il parsing JSON successivo
  const rawBody   = await req.text()
  const hookSecret = process.env.SUPABASE_HOOK_SECRET?.trim()

  // [hook-diag] è la PRIMA riga — il viewer Vercel tronca quelle successive
  const { ok: authorized, diag } = hookSecret
    ? checkHookSecret(req.headers, rawBody, hookSecret)
    : { ok: true, diag: { skipped: true } }
  console.log('[hook-diag]', JSON.stringify({ hasSecret: !!hookSecret, ...diag }))

  if (!authorized) {
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

    case 'email_change': {
      // La nuova email è quella che ha ricevuto il messaggio (il campo "to" dell'hook)
      email = emailChangeEmail(confirmUrl, to)
      break
    }

    case 'reauthentication':
      email = reauthEmail(emailData.token as string ?? '')
      break

    default:
      // Tipo non gestito: restituiamo 200 per non bloccare il flusso auth.
      // Supabase non manderà la sua email (hook ha "risposto"), quindi loggare
      // per aggiungere il handler nel minor tempo possibile.
      console.warn('[send-email hook] tipo non gestito:', actionType, '— nessuna email inviata')
      return NextResponse.json({ ok: true, warning: `unhandled type: ${actionType}` })
  }

  try {
    await resend.emails.send({ from: FROM, to, subject: email.subject, html: email.html })
  } catch (err) {
    console.error('[send-email hook] errore Resend:', err)
    // Non restituiamo 500 per non bloccare il flusso auth lato Supabase.
    // L'email non sarà stata inviata ma l'operazione auth continua.
    return NextResponse.json({ ok: false, error: 'send failed' }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
