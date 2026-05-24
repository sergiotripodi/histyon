/**
 * SOURCE OF TRUTH per i costi del ciclo di fatturazione corrente.
 *
 * Chiamata da:
 *   - app/ops-histyon-console/dashboard/page.tsx        (home + PaymentBanner)
 *   - app/ops-histyon-console/dashboard/payments/page.tsx (live del mese corrente)
 *   - components/admin/PaymentBanner.tsx (indirettamente, riceve i dati dalla home)
 *
 * Tutte queste pagine DEVONO usare questa funzione, altrimenti i totali divergono
 * (è esattamente quello che è successo: home mostrava $45, payments $20).
 *
 * Fonti dati:
 *   - Vercel:   GET /v1/billing/charges (FOCUS v1.3) — totalEffective già post-crediti
 *   - Supabase: GET /v1/organizations/{id} → plan → prezzo fisso del piano
 *   - Resend:   prezzo del piano selezionato + overage calcolato dalle email del ciclo
 */

import { getBillingPeriodMs } from './config'
import { fetchVercelBilling } from '@/lib/vercel/billing'
import { fetchSupabaseManagement } from '@/lib/supabase/management'
import { RESEND_PLANS, RESEND_OVERAGE_RATE, type ResendPlanKey } from '@/lib/resend/plans'

export interface CurrentCosts {
  /** Vercel: somma di tutti gli EffectiveCost dal billing API (post-crediti) */
  vercel: {
    recurring: number     // voci "Pro Plan" / "Subscription"
    addon:     number     // tutto il resto (functions, bandwidth, domini, etc.)
    total:     number     // recurring + addon
    billed:    number     // BilledCost lordo (pre-crediti)
    credits:   number     // crediti applicati (valore positivo)
    available: boolean    // true se l'API ha risposto
    error?:    string     // messaggio errore se available=false
  }
  /** Supabase: prezzo del piano (l'API non espone usage/overage) */
  supabase: {
    plan:      string     // 'free' | 'pro' | 'team' | ...
    recurring: number     // $25 se Pro, $0 se Free
    addon:     number     // sempre 0: API non espone overage
    total:     number
    available: boolean
  }
  /** Resend: piano + overage da conteggio email */
  resend: {
    planKey:   ResendPlanKey
    recurring: number     // prezzo del piano
    addon:     number     // overage (emailSent - quota) * rate
    emailsSent: number | null
    total:     number
  }
  /** Totale unificato — questa è LA cifra mostrata ovunque */
  totalRecurring: number  // vercel.recurring + supabase.recurring + resend.recurring
  totalAddon:     number  // vercel.addon + supabase.addon + resend.addon
  totalEffective: number  // totale netto (somma di tutto)
  /** Periodo di fatturazione (24→23 del mese successivo) */
  periodStart:    number  // ms UTC
  periodEnd:      number  // ms UTC (esclusivo)
}

const SUBSCRIPTION_REGEX = /pro plan|subscription|hobby plan|enterprise plan/i

/**
 * Calcola tutti i costi del ciclo CORRENTE in un colpo.
 * Le pagine devono solo destrutturare e mostrare — niente calcoli locali.
 */
export async function getCurrentCosts(opts: {
  resendPlanKey: ResendPlanKey
}): Promise<CurrentCosts> {
  const { startMs, endMs } = getBillingPeriodMs()
  const resendPlan = RESEND_PLANS[opts.resendPlanKey] ?? RESEND_PLANS.free

  // ── Lancio tutte le fetch in parallelo ─────────────────────────────────────
  const vercelToken  = process.env.ADMIN_VERCEL_TOKEN
  const vercelTeamId = process.env.ADMIN_VERCEL_TEAM_ID
  const sbToken      = process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN
  const sbProjectId  = process.env.ADMIN_SUPABASE_PROJECT_ID
  const resendKey    = process.env.RESEND_API_KEY

  const [vercelBilling, sbResult, emailsSent] = await Promise.all([
    vercelToken && vercelTeamId
      ? fetchVercelBilling({ token: vercelToken, teamId: vercelTeamId, fromMs: startMs, toMs: endMs })
      : Promise.resolve(null),
    sbToken && sbProjectId
      ? fetchSupabaseManagement({ token: sbToken, projectId: sbProjectId })
      : Promise.resolve(null),
    resendKey ? countResendEmailsForPeriod(resendKey, startMs, endMs) : Promise.resolve(null),
  ])

  // ── VERCEL: separa Pro Plan (recurring) dal resto (addon) ──────────────────
  let vercelRecurring = 0, vercelAddon = 0
  let vercelBilled = 0, vercelCredits = 0
  const vercelAvailable = vercelBilling?.ok ?? false
  const vercelError = vercelBilling?.error

  if (vercelBilling?.ok) {
    for (const s of vercelBilling.services) {
      if (SUBSCRIPTION_REGEX.test(s.name)) vercelRecurring += s.effectiveCost
      else vercelAddon += s.effectiveCost
    }
    vercelBilled  = vercelBilling.totalBilled
    vercelCredits = vercelBilling.creditsApplied
  }

  // ── SUPABASE: solo prezzo del piano (l'API non espone overage) ─────────────
  const sbPlan = sbResult?.org?.plan ?? 'free'
  const sbIsPro = sbPlan !== 'free'
  const sbRecurring = sbIsPro ? 25 : 0

  // ── RESEND: prezzo piano + overage da conteggio ────────────────────────────
  const resendRecurring = resendPlan.price
  const overage = emailsSent !== null ? Math.max(0, emailsSent - resendPlan.quota) : 0
  const resendAddon = (overage / 1_000) * RESEND_OVERAGE_RATE

  const totalRecurring = vercelRecurring + sbRecurring + resendRecurring
  const totalAddon     = vercelAddon + resendAddon
  const totalEffective = totalRecurring + totalAddon

  return {
    vercel: {
      recurring: vercelRecurring,
      addon:     vercelAddon,
      total:     vercelRecurring + vercelAddon,
      billed:    vercelBilled,
      credits:   vercelCredits,
      available: vercelAvailable,
      error:     vercelError,
    },
    supabase: {
      plan:      sbPlan,
      recurring: sbRecurring,
      addon:     0,
      total:     sbRecurring,
      available: !!sbResult?.org,
    },
    resend: {
      planKey:   opts.resendPlanKey,
      recurring: resendRecurring,
      addon:     resendAddon,
      emailsSent,
      total:     resendRecurring + resendAddon,
    },
    totalRecurring,
    totalAddon,
    totalEffective,
    periodStart: startMs,
    periodEnd:   endMs,
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseResendDate(raw: unknown): Date | null {
  if (!raw) return null
  const s = String(raw).trim()
    .replace(' ', 'T')
    .replace(/(\+00(?::00)?|Z)?$/, 'Z')
    .replace(/\.\d{4,}Z$/, (m) => m.slice(0, 4) + 'Z')
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

async function countResendEmailsForPeriod(
  key: string,
  startMs: number,
  endMs: number,
): Promise<number | null> {
  const monthStart = new Date(startMs)
  const monthEnd   = new Date(endMs)
  let total = 0, offset = 0
  try {
    for (let page = 0; page < 10; page++) {
      const res = await fetch(`https://api.resend.com/emails?limit=100&offset=${offset}`, {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 300 },
      })
      if (!res.ok) return total > 0 ? total : null
      const emails: any[] = (await res.json()).data ?? []
      if (!emails.length) break
      let done = false
      for (const e of emails) {
        const created = parseResendDate(e.created_at)
        if (!created) continue
        if (created >= monthStart && created < monthEnd) total++
        else if (created < monthStart) { done = true; break }
      }
      if (done || emails.length < 100) break
      offset += 100
    }
    return total
  } catch { return null }
}
