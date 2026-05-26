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
// Supabase Auth Hooks inviano il secret come Bearer token diretto nell'header
// Authorization oppure come JWT HS256. Proviamo entrambi gli approcci.

function verifyHookSecret(authHeader: string, secret: string): boolean {
  // Approccio 1: Bearer diretto (es. "Bearer v1,whsec_xxx")
  if (authHeader === `Bearer ${secret}`) return true

  // Approccio 2: JWT HS256 — proviamo con secret raw e con chiave decoded
  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const parts = token.split('.')
    if (parts.length !== 3) return false

    // Prova con il secret grezzo come chiave
    const tryKey = (key: Buffer) => {
      const expected = createHmac('sha256', key)
        .update(`${parts[0]}.${parts[1]}`)
        .digest('base64url')
      const a = Buffer.from(expected)
      const b = Buffer.from(parts[2])
      if (a.length !== b.length) return false
      return timingSafeEqual(a, b)
    }

    // Chiave 1: secret raw
    if (tryKey(Buffer.from(secret))) return true

    // Chiave 2: decodifica la parte base64 dopo "whsec_"
    const match = secret.match(/whsec_([A-Za-z0-9+/=_-]+)/)
    if (match) {
      if (tryKey(Buffer.from(match[1], 'base64'))) return true
      if (tryKey(Buffer.from(match[1], 'base64url'))) return true
    }

    return false
  } catch { return false }
}

// ── Link builder ──────────────────────────────────────────────────────────────

function buildVerifyUrl(tokenHash: string, type: string, redirectTo: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Auth: verifica secret se configurato
  const hookSecret = process.env.SUPABASE_HOOK_SECRET
  const authHeader = req.headers.get('authorization') ?? ''

  // Log per debug (mostra solo il prefisso dell'header, non il secret completo)
  console.log('[send-email hook] auth header prefix:', authHeader.slice(0, 20))

  if (hookSecret && !verifyHookSecret(authHeader, hookSecret)) {
    console.error('[send-email hook] verifica secret fallita')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
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
