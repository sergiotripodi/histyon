/**
 * POST /api/admin/billing/snapshot
 *
 * Viene chiamato dal cron Vercel ogni giorno alle 06:00 UTC.
 * Se oggi è BILLING_DAY (da lib/billing/config.ts) salva/aggiorna lo snapshot
 * del mese corrente in admin_billing_snapshots; altrimenti risponde 204 senza fare nulla.
 *
 * Autenticazione: header  Authorization: Bearer <CRON_SECRET>
 * (Vercel lo invia automaticamente per i cron configurati in vercel.json)
 *
 * Env var richieste (oltre a quelle già esistenti):
 *   CRON_SECRET   — stringa casuale, da impostare nelle env Vercel
 *
 * Il piano Resend viene letto dalla tabella admin_settings (chiave "resend_plan"),
 * aggiornata automaticamente ogni volta che si usa il menu nella console admin.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTotalStorage } from '@/lib/usage/storage'
import { RESEND_PLANS, RESEND_OVERAGE_RATE, type ResendPlanKey } from '@/lib/resend/plans'
import {
  BILLING_DAY,
  PROJECT_START,
  SB_FALLBACK,
  SB_OVERAGE_DB_PER_GiB,
  SB_OVERAGE_STORAGE_PER_GiB,
  SB_OVERAGE_EGRESS_PER_GiB,
} from '@/lib/billing/config'

const SB_INCLUDED_DB_GiB      = SB_FALLBACK.db_size.pro / (1024 ** 3)
const SB_INCLUDED_STORAGE_GiB = SB_FALLBACK.storage.pro / (1024 ** 3)
const SB_INCLUDED_EGRESS_GiB  = SB_FALLBACK.egress.pro  / (1024 ** 3)

const GiB = 1024 * 1024 * 1024

// ─── helpers ────────────────────────────────────────────────────────────────

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7)
}

// ── Vercel ───────────────────────────────────────────────────────────────────

async function fetchVercelCosts(monthStr: string): Promise<{ recurring: number; addon: number }> {
  const token  = process.env.ADMIN_VERCEL_TOKEN
  const teamId = process.env.ADMIN_VERCEL_TEAM_ID
  if (!token || !teamId) return { recurring: 0, addon: 0 }

  try {
    const teamRes  = await fetch(`https://api.vercel.com/v1/teams/${teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const teamJson = teamRes.ok ? await teamRes.json() : null
    const plan: string = teamJson?.billing?.plan ?? 'hobby'
    const recurring = plan === 'pro' ? 20 : 0

    // Domini acquistati/rinnovati nel mese corrente
    const domainsRes = await fetch(
      `https://api.vercel.com/v5/domains?teamId=${teamId}&limit=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const domainsJson = domainsRes.ok ? await domainsRes.json() : { domains: [] }
    const domains: any[] = domainsJson.domains ?? []

    const [y, m] = monthStr.split('-').map(Number)
    const monthStart = new Date(y, m - 1, 1).getTime()
    const monthEnd   = new Date(y, m, 1).getTime()

    let domainAddon = 0
    for (const d of domains) {
      const eventTs: number | null = d.renewedAt ?? d.boughtAt ?? null
      if (eventTs !== null && eventTs >= monthStart && eventTs < monthEnd) {
        const priceRes = await fetch(
          `https://api.vercel.com/v4/domains/${d.name}/price?type=renewal&teamId=${teamId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ).catch(() => null)
        if (priceRes?.ok) {
          const p = await priceRes.json()
          domainAddon += Number(p?.price ?? 0)
        }
      }
    }

    return { recurring, addon: domainAddon }
  } catch {
    return { recurring: 0, addon: 0 }
  }
}

// ── Supabase ─────────────────────────────────────────────────────────────────

async function fetchSupabaseCosts(): Promise<{ recurring: number; addon: number }> {
  const mgmtToken = process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace('https://', '')
    .split('.')[0]  // estrae il project ref dall'URL

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Piano ricorrente
  let recurring = 0
  let sbPlan = 'free'
  if (mgmtToken) {
    try {
      const orgRes = await fetch('https://api.supabase.com/v1/organizations', {
        headers: { Authorization: `Bearer ${mgmtToken}`, 'Content-Type': 'application/json' },
      })
      const orgJson = orgRes.ok ? await orgRes.json() : null
      const org = Array.isArray(orgJson) ? orgJson[0] : null
      sbPlan = org?.plan ?? 'free'
      recurring = sbPlan === 'pro' ? 25 : 0
    } catch { /* usa free */ }
  }

  // Overage (solo su Pro)
  let addon = 0
  if (sbPlan === 'pro') {
    try {
      const [dbSizeResult, storageStats] = await Promise.all([
        db.rpc('get_db_size_bytes').then(({ data }) => data as number | null, () => null),
        getTotalStorage().catch(() => null),
      ])

      // DB overage
      if (dbSizeResult !== null) {
        const dbGiB = dbSizeResult / GiB
        if (dbGiB > SB_INCLUDED_DB_GiB) {
          addon += (dbGiB - SB_INCLUDED_DB_GiB) * SB_OVERAGE_DB_PER_GiB
        }
      }

      // Storage overage
      if (storageStats !== null) {
        const storageGiB = storageStats.totalBytes / GiB
        if (storageGiB > SB_INCLUDED_STORAGE_GiB) {
          addon += (storageGiB - SB_INCLUDED_STORAGE_GiB) * SB_OVERAGE_STORAGE_PER_GiB
        }
      }

      // Egress overage (da management API)
      if (mgmtToken && projectRef) {
        try {
          const now   = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          const end   = now.toISOString()
          const egRes = await fetch(
            `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/storage.daily?` +
            `interval=1d&iso_timestamp_start=${start}&iso_timestamp_end=${end}`,
            { headers: { Authorization: `Bearer ${mgmtToken}`, 'Content-Type': 'application/json' } },
          )
          if (egRes.ok) {
            const egJson = await egRes.json()
            const rows: any[] = egJson?.result?.[0]?.data ?? []
            const egressBytes = rows.reduce((sum: number, r: any) => sum + (r.egress_bytes ?? 0), 0)
            const egressGiB   = egressBytes / GiB
            if (egressGiB > SB_INCLUDED_EGRESS_GiB) {
              addon += (egressGiB - SB_INCLUDED_EGRESS_GiB) * SB_OVERAGE_EGRESS_PER_GiB
            }
          }
        } catch { /* egress non disponibile */ }
      }
    } catch { /* addon = 0 */ }
  }

  return { recurring, addon: Math.round(addon * 100) / 100 }
}

// ── Resend ───────────────────────────────────────────────────────────────────

async function countResendEmailsForMonth(key: string, monthStr: string): Promise<number> {
  const [y, m] = monthStr.split('-').map(Number)
  const monthStart = new Date(Date.UTC(y, m - 1, 1))
  const monthEnd   = new Date(Date.UTC(y, m, 1))

  let total = 0, offset = 0
  for (let page = 0; page < 10; page++) {
    const res = await fetch(`https://api.resend.com/emails?limit=100&offset=${offset}`, {
      headers: { Authorization: `Bearer ${key}` },
    }).catch(() => null)
    if (!res?.ok) break
    const emails: any[] = (await res.json()).data ?? []
    if (!emails.length) break
    for (const e of emails) {
      if (!e.created_at) continue
      const created = new Date(e.created_at)
      if (isNaN(created.getTime())) continue
      if (created >= monthStart && created < monthEnd) total++
      else if (created < monthStart) return total
    }
    if (emails.length < 100) break
    offset += 100
  }
  return total
}

async function getResendPlanFromDb(): Promise<ResendPlanKey> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data } = await db
      .from('admin_settings')
      .select('value')
      .eq('key', 'resend_plan')
      .single<{ value: string }>()
    const val = data?.value ?? 'free'
    return (val in RESEND_PLANS ? val : 'free') as ResendPlanKey
  } catch {
    return 'free'
  }
}

async function fetchResendCosts(monthStr: string): Promise<{ recurring: number; addon: number }> {
  const key     = process.env.RESEND_API_KEY
  // Legge il piano dal DB (aggiornato ogni volta che si usa il menu nella console)
  const planKey = await getResendPlanFromDb()
  const plan    = RESEND_PLANS[planKey] ?? RESEND_PLANS.free

  if (!key) return { recurring: plan.price, addon: 0 }

  try {
    const emailsSent    = await countResendEmailsForMonth(key, monthStr)
    const overageEmails = Math.max(0, emailsSent - plan.quota)
    const overageCost   = (overageEmails / 1_000) * RESEND_OVERAGE_RATE
    return { recurring: plan.price, addon: Math.round(overageCost * 100) / 100 }
  } catch {
    return { recurring: plan.price, addon: 0 }
  }
}

// ─── handler ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Autenticazione
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('Authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().getDate()

  // Il cron gira ogni giorno: esegui solo il giorno BILLING_DAY
  if (today !== BILLING_DAY) {
    return new NextResponse(null, { status: 204 })
  }

  const monthStr = currentMonthStr()
  if (monthStr < PROJECT_START) {
    return NextResponse.json({ error: 'Month before project start' }, { status: 400 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const [vercel, supabase, resend] = await Promise.all([
    fetchVercelCosts(monthStr),
    fetchSupabaseCosts(),
    fetchResendCosts(monthStr),
  ])

  const { error } = await db
    .from('admin_billing_snapshots')
    .upsert({
      month:              monthStr,
      vercel_recurring:   vercel.recurring,
      supabase_recurring: supabase.recurring,
      resend_recurring:   resend.recurring,
      vercel_addon:       vercel.addon,
      supabase_addon:     supabase.addon,
      resend_addon:       resend.addon,
    }, { onConflict: 'month' })

  if (error) {
    console.error('[billing/snapshot] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total =
    vercel.recurring + vercel.addon +
    supabase.recurring + supabase.addon +
    resend.recurring + resend.addon

  return NextResponse.json({ ok: true, month: monthStr, vercel, supabase, resend, total })
}
