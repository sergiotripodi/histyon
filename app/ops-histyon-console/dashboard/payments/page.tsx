import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'
import { MonthBadge } from '@/components/admin/MonthBadge'
import { RESEND_PLANS, RESEND_OVERAGE_RATE, type ResendPlanKey } from '@/lib/resend/plans'
import { SpendingChart, type MonthSpend } from '@/components/admin/SpendingChart'
import { BILLING_DAY, PROJECT_START } from '@/lib/billing/config'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagamenti' }

// ─── tipi ────────────────────────────────────────────────────────────────────

interface SnapshotRow {
  month:               string
  vercel_recurring:    number
  supabase_recurring:  number
  resend_recurring:    number
  vercel_addon:        number
  supabase_addon:      number
  resend_addon:        number
  total_cost:          number
}

// ─── fetch live (mese corrente) ───────────────────────────────────────────────

async function fetchLivePlans() {
  const vercelToken  = process.env.ADMIN_VERCEL_TOKEN
  const vercelTeamId = process.env.ADMIN_VERCEL_TEAM_ID
  const sbToken      = process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN

  const [vercelRes, sbOrgsRes] = await Promise.all([
    vercelToken && vercelTeamId
      ? fetch(`https://api.vercel.com/v1/teams/${vercelTeamId}`, {
          headers: { Authorization: `Bearer ${vercelToken}` },
          next: { revalidate: 300 },
        }).catch(() => null)
      : Promise.resolve(null),
    sbToken
      ? fetch('https://api.supabase.com/v1/organizations', {
          headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
          next: { revalidate: 300 },
        }).catch(() => null)
      : Promise.resolve(null),
  ])

  const [vercelJson, sbOrgsJson] = await Promise.all([
    vercelRes?.ok ? vercelRes.json().catch(() => null) : Promise.resolve(null),
    sbOrgsRes?.ok ? sbOrgsRes.json().catch(() => null) : Promise.resolve(null),
  ])

  const vercelPlan: string = vercelJson?.billing?.plan ?? 'hobby'
  const sbOrg = Array.isArray(sbOrgsJson) ? sbOrgsJson[0] : null
  const sbPlan: string = sbOrg?.plan ?? 'free'

  return { vercelPlan, sbPlan }
}

/** Domini Vercel acquistati/rinnovati nel mese corrente */
async function fetchVercelDomainAddon(monthStr: string): Promise<number> {
  const token  = process.env.ADMIN_VERCEL_TOKEN
  const teamId = process.env.ADMIN_VERCEL_TEAM_ID
  if (!token || !teamId) return 0

  try {
    const res = await fetch(
      `https://api.vercel.com/v5/domains?teamId=${teamId}&limit=100`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 60 } },
    )
    if (!res.ok) return 0
    const json = await res.json()
    const domains: any[] = json.domains ?? []

    const [y, m] = monthStr.split('-').map(Number)
    const monthStart = new Date(y, m - 1, 1).getTime()
    const monthEnd   = new Date(y, m, 1).getTime()

    let total = 0
    for (const d of domains) {
      const eventTs: number | null = d.renewedAt ?? d.boughtAt ?? null
      if (eventTs !== null && eventTs >= monthStart && eventTs < monthEnd) {
        const priceRes = await fetch(
          `https://api.vercel.com/v4/domains/${d.name}/price?type=renewal&teamId=${teamId}`,
          { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 3600 } },
        ).catch(() => null)
        if (priceRes?.ok) {
          const p = await priceRes.json()
          total += Number(p?.price ?? 0)
        }
      }
    }
    return total
  } catch { return 0 }
}

function parseResendDate(raw: unknown): Date | null {
  if (!raw) return null
  const s = String(raw).trim()
    .replace(' ', 'T')
    .replace(/(\+00(?::00)?|Z)?$/, 'Z')
    .replace(/\.\d{4,}Z$/, (m) => m.slice(0, 4) + 'Z')
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

async function countResendEmailsForMonth(key: string, monthStr: string): Promise<number | null> {
  const [y, m] = monthStr.split('-').map(Number)
  const monthStart = new Date(Date.UTC(y, m - 1, 1))
  const monthEnd   = new Date(Date.UTC(y, m, 1))

  let total = 0, offset = 0
  for (let page = 0; page < 10; page++) {
    const res = await fetch(`https://api.resend.com/emails?limit=100&offset=${offset}`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    }).catch(() => null)
    if (!res?.ok) return total > 0 ? total : null
    const emails: any[] = (await res.json()).data ?? []
    if (!emails.length) break
    for (const e of emails) {
      const created = parseResendDate(e.created_at)
      if (!created) continue
      if (created >= monthStart && created < monthEnd) total++
      else if (created < monthStart) return total
    }
    if (emails.length < 100) break
    offset += 100
  }
  return total
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function computeHistoricalTotal(snapshots: SnapshotRow[], liveTotal: number): number {
  const snapshotMonths = new Set(snapshots.map(s => s.month))
  const currentMonth   = new Date().toISOString().slice(0, 7)

  // Somma snapshot passati + mese corrente live
  const snapshotSum = snapshots.reduce((sum, s) => sum + s.total_cost, 0)
  const currentContrib = snapshotMonths.has(currentMonth) ? 0 : liveTotal

  return snapshotSum + currentContrib
}

// ─── Resend icon ──────────────────────────────────────────────────────────────

function ResendIcon() {
  return <span className="text-white font-black text-[13px] leading-none select-none">R</span>
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const sp           = await searchParams
  const now          = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const monthStr     = sp.month ?? currentMonth
  const isCurrentMonth = monthStr === currentMonth
  const isFuture       = monthStr > currentMonth
  const isBillingDay   = now.getDate() >= BILLING_DAY && isCurrentMonth

  const cookieStore   = await cookies()
  const resendPlanKey = (cookieStore.get('resend_plan')?.value ?? 'free') as ResendPlanKey
  const resendPlan    = RESEND_PLANS[resendPlanKey] ?? RESEND_PLANS.free

  // DB admin client (service_role)
  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Leggi tutti gli snapshot disponibili (per chart e totale storico)
  const { data: allSnapshots } = await db
    .from('admin_billing_snapshots')
    .select('month, vercel_recurring, supabase_recurring, resend_recurring, vercel_addon, supabase_addon, resend_addon, total_cost')
    .order('month', { ascending: true })

  const snapshots: SnapshotRow[] = (allSnapshots ?? []).map(s => ({
    month:               s.month,
    vercel_recurring:    Number(s.vercel_recurring),
    supabase_recurring:  Number(s.supabase_recurring),
    resend_recurring:    Number(s.resend_recurring),
    vercel_addon:        Number(s.vercel_addon),
    supabase_addon:      Number(s.supabase_addon),
    resend_addon:        Number(s.resend_addon),
    total_cost:          Number(s.total_cost),
  }))

  // Snapshot per il mese visualizzato (se esiste)
  const viewedSnapshot = snapshots.find(s => s.month === monthStr)

  // ── Costi del mese visualizzato ──────────────────────────────────────────
  let vercelPlan   = 'hobby'
  let sbPlan       = 'free'
  let vercelMonthlyCost  = 0
  let sbMonthlyCost      = 0
  let resendMonthlyCost: number = resendPlan.price
  let vercelAddon        = 0
  let resendAddon        = 0
  let totalAddon         = 0
  let dataSource: 'live' | 'snapshot' | 'none' = 'none'

  if (isFuture) {
    dataSource = 'none'
  } else if (isCurrentMonth) {
    // Live
    dataSource = 'live'
    const plans = await fetchLivePlans()
    vercelPlan        = plans.vercelPlan
    sbPlan            = plans.sbPlan
    vercelMonthlyCost = vercelPlan !== 'hobby' && vercelPlan !== 'free' ? 20 : 0
    sbMonthlyCost     = sbPlan !== 'free' ? 25 : 0

    const [domainAddon, emailsSent] = await Promise.all([
      fetchVercelDomainAddon(currentMonth),
      process.env.RESEND_API_KEY
        ? countResendEmailsForMonth(process.env.RESEND_API_KEY, currentMonth)
        : Promise.resolve(null),
    ])
    vercelAddon = domainAddon
    if (emailsSent !== null) {
      const overageEmails = Math.max(0, emailsSent - resendPlan.quota)
      resendAddon = (overageEmails / 1_000) * RESEND_OVERAGE_RATE
    }
    totalAddon = vercelAddon + resendAddon
  } else if (viewedSnapshot) {
    // Dal DB
    dataSource        = 'snapshot'
    vercelMonthlyCost = viewedSnapshot.vercel_recurring
    sbMonthlyCost     = viewedSnapshot.supabase_recurring
    resendMonthlyCost = viewedSnapshot.resend_recurring
    vercelAddon       = viewedSnapshot.vercel_addon
    resendAddon       = viewedSnapshot.resend_addon
    totalAddon        = viewedSnapshot.vercel_addon + viewedSnapshot.supabase_addon + viewedSnapshot.resend_addon
  }

  const recurringCost = vercelMonthlyCost + sbMonthlyCost + resendMonthlyCost

  // Totale storico: somma snapshot reali + mese corrente live
  const liveMonthTotal = recurringCost + totalAddon
  const historicalTotal = computeHistoricalTotal(snapshots, liveMonthTotal)

  // ── Dati grafico ─────────────────────────────────────────────────────────
  // Genera i mesi dal PROJECT_START a oggi
  const chartData: MonthSpend[] = []
  {
    const start = new Date(PROJECT_START + '-01')
    const d = new Date(start.getFullYear(), start.getMonth(), 1)
    while (
      d.getFullYear() < now.getFullYear() ||
      (d.getFullYear() === now.getFullYear() && d.getMonth() <= now.getMonth())
    ) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const snap = snapshots.find(s => s.month === key)

      if (snap) {
        // Dati reali dal DB
        chartData.push({
          month:    key,
          vercel:   snap.vercel_recurring + snap.vercel_addon,
          supabase: snap.supabase_recurring + snap.supabase_addon,
          resend:   snap.resend_recurring + snap.resend_addon,
        })
      } else if (key === currentMonth) {
        // Mese corrente: dati live
        chartData.push({
          month:    key,
          vercel:   vercelMonthlyCost + vercelAddon,
          supabase: sbMonthlyCost,
          resend:   resendMonthlyCost + resendAddon,
        })
      } else {
        // Mese passato senza snapshot: placeholder vuoto
        chartData.push({ month: key, vercel: 0, supabase: 0, resend: 0 })
      }

      d.setMonth(d.getMonth() + 1)
    }
  }

  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pagamenti e costi</h1>
      </div>

      {/* Month picker */}
      <Suspense>
        <MonthPicker minMonth="2026-05" />
      </Suspense>

      {/* 3 cost boxes */}
      {isFuture ? (
        <div className="border border-gray-200 bg-white px-8 py-10 text-center mb-8">
          <p className="text-sm text-gray-400">Nessun dato per mesi futuri.</p>
        </div>
      ) : dataSource === 'none' && !isCurrentMonth ? (
        <div className="border border-gray-200 bg-white px-8 py-10 text-center mb-8">
          <p className="text-sm text-gray-400 mb-1">Snapshot non disponibile per {new Date(monthStr + '-02').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}.</p>
          <p className="text-[11px] text-gray-300">Il cron salva automaticamente lo snapshot il giorno {BILLING_DAY} di ogni mese.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Box 1: Spese fisse */}
          <div className="border border-gray-200 bg-white px-8 py-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
              Spese fisse
            </p>
            <p className="text-4xl font-bold tabular-nums text-gray-900">${recurringCost.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-2">Piano mensile Vercel + Supabase + Resend</p>
            {isBillingDay && isCurrentMonth && (
              <p className="text-[10px] text-amber-600 font-medium mt-2 uppercase tracking-wide">Ciclo in chiusura oggi</p>
            )}
            {dataSource === 'snapshot' && (
              <p className="text-[10px] text-gray-300 mt-2 uppercase tracking-wide">Dato storico</p>
            )}
          </div>

          {/* Box 2: Spese aggiuntive */}
          <div className="border border-gray-200 bg-white px-8 py-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
              Spese aggiuntive
            </p>
            <p className="text-4xl font-bold tabular-nums text-gray-900">${totalAddon.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-2">
              {totalAddon > 0
                ? `Domini${vercelAddon > 0 ? ` $${vercelAddon.toFixed(2)}` : ''}, overage email${resendAddon > 0 ? ` $${resendAddon.toFixed(2)}` : ''}`
                : 'Overage, domini, add-on uso eccedente'
              }
            </p>
          </div>

          {/* Box 3: Totale storico */}
          <div className="border border-gray-900 bg-gray-900 px-8 py-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
              Totale storico Histyon
            </p>
            <p className="text-4xl font-bold tabular-nums text-white">${historicalTotal.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">
              Spesa cumulata dall&apos;avvio · {snapshots.length} {snapshots.length === 1 ? 'mese' : 'mesi'} salvati
            </p>
          </div>
        </div>
      )}

      {/* Service cards */}
      {!isFuture && (dataSource === 'live' || dataSource === 'snapshot') && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Costi per servizio</h2>
            <MonthBadge monthStr={monthStr} live={isCurrentMonth} />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">

            <Link href="/ops-histyon-console/dashboard/vercel" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gray-900 flex items-center justify-center">
                    <svg viewBox="0 0 116 100" fill="white" className="w-3.5 h-3.5"><path d="M57.5 15L100 85H15L57.5 15Z" /></svg>
                  </div>
                  <span className="text-sm font-bold text-gray-900">Vercel</span>
                </div>
                {isCurrentMonth && (
                  <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">{vercelPlan}</span>
                )}
              </div>
              <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">
                ${(vercelMonthlyCost + vercelAddon).toFixed(2)}
              </p>
              {vercelAddon > 0 && (
                <p className="text-[10px] text-gray-400 mb-1">di cui ${vercelAddon.toFixed(2)} domini</p>
              )}
              <p className="text-xs text-gray-400 flex items-center gap-1">Vedi dettaglio <ExternalLink className="w-3 h-3" /></p>
            </Link>

            <Link href="/ops-histyon-console/dashboard/supabase" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[#3ECF8E] flex items-center justify-center">
                    <svg viewBox="0 0 109 113" fill="none" className="w-3.5 h-3.5">
                      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="white" />
                      <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="white" fillOpacity="0.7" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-gray-900">Supabase</span>
                </div>
                {isCurrentMonth && (
                  <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">{sbPlan}</span>
                )}
              </div>
              <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">${sbMonthlyCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">Vedi dettaglio <ExternalLink className="w-3 h-3" /></p>
            </Link>

            <Link href="/ops-histyon-console/dashboard/resend" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-black flex items-center justify-center">
                    <ResendIcon />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Resend</span>
                </div>
                {isCurrentMonth && (
                  <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">{resendPlanKey.replace(/_/g, ' ')}</span>
                )}
              </div>
              <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">
                ${(resendMonthlyCost + resendAddon).toFixed(2)}
              </p>
              {resendAddon > 0 && (
                <p className="text-[10px] text-gray-400 mb-1">di cui ${resendAddon.toFixed(2)} overage</p>
              )}
              <p className="text-xs text-gray-400 flex items-center gap-1">Vedi dettaglio <ExternalLink className="w-3 h-3" /></p>
            </Link>

          </div>
        </>
      )}

      {/* Spending chart */}
      <div className="mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-6">
          Andamento spese mensili
        </h2>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <SpendingChart data={chartData} />
        </div>
      </div>

      {/* Nota ciclo */}
      <p className="text-[11px] text-gray-400 mb-8">
        Il ciclo di fatturazione si azzera il giorno <strong className="text-gray-600">{BILLING_DAY}</strong> di ogni mese.
      </p>

      {/* External links */}
      <div className="border-t border-gray-100 pt-6 flex gap-6 flex-wrap">
        {[
          { label: 'Fatturazione Vercel',   href: 'https://vercel.com/account/billing' },
          { label: 'Fatturazione Supabase', href: 'https://supabase.com/dashboard/account/billing' },
          { label: 'Fatturazione Resend',   href: 'https://resend.com/settings/billing' },
        ].map(({ label, href }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            {label} <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    </div>
  )
}
