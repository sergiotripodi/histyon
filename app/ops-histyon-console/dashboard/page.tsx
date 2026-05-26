import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { MonthPicker } from '@/components/admin/MonthPicker'
import { CostBarChart } from '@/components/admin/CostBarChart'
import { ResendPlanSelector } from '@/components/admin/ResendPlanSelector'
import { getTotalStorage } from '@/lib/usage/storage'
import { getTotalEgress } from '@/lib/usage/egress'
import { RESEND_PLANS, RESEND_OVERAGE_RATE, type ResendPlanKey } from '@/lib/resend/plans'
import { getBillingPeriodMs, BILLING_DAY, PROJECT_START } from '@/lib/billing/config'
import { getCurrentCosts } from '@/lib/billing/current-costs'
import { fetchVercelBilling } from '@/lib/vercel/billing'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

async function getVercelMonthlyCost(): Promise<{ recurring: number; addon: number }> {
  const token  = process.env.ADMIN_VERCEL_TOKEN
  const teamId = process.env.ADMIN_VERCEL_TEAM_ID
  if (!token || !teamId) return { recurring: 0, addon: 0 }

  // Query the last 180 days — Vercel posts charges with a delay, often for past periods
  const billing = await fetchVercelBilling({
    token, teamId,
    fromMs: Date.now() - 180 * 24 * 60 * 60 * 1000,
    toMs:   Date.now() + 24 * 60 * 60 * 1000,
    revalidate: 300,
  })

  if (billing.ok && billing.rowCount > 0) {
    const SUBSCRIPTION_RE = /pro plan|subscription|hobby plan|enterprise plan/i
    // Use billedCost (gross, pre-credits) so the Pro subscription always shows $20
    // even when Vercel applies $20 credits that zero out the effectiveCost
    const recurring = billing.services
      .filter(s => SUBSCRIPTION_RE.test(s.name))
      .reduce((sum, s) => sum + s.billedCost, 0)
    const addon = billing.services
      .filter(s => !SUBSCRIPTION_RE.test(s.name))
      .reduce((sum, s) => sum + Math.max(0, s.billedCost), 0)
    return { recurring, addon }
  }

  // Fallback: Teams API for plan price + Domains API for domain costs
  const headers = { Authorization: `Bearer ${token}` }
  try {
    const [teamRes, domainsRes] = await Promise.all([
      fetch(`https://api.vercel.com/v2/teams/${teamId}`, { headers, next: { revalidate: 300 } } as RequestInit),
      fetch(`https://api.vercel.com/v5/domains?teamId=${teamId}`, { headers, next: { revalidate: 60 } } as RequestInit),
    ])
    const team        = teamRes.ok    ? await teamRes.json().catch(() => null)            : null
    const domainsJson = domainsRes.ok ? await domainsRes.json().catch(() => null)         : null
    const plan: string = team?.billing?.plan ?? 'hobby'
    const recurring    = plan !== 'hobby' && plan !== 'free' ? 20 : 0
    const domains: any[] = domainsJson?.domains ?? []
    const cutoff = Date.now() - 13 * 30 * 24 * 3600 * 1000
    const addon = domains
      .filter((d: any) => d.price && (
        (d.boughtAt   && new Date(d.boughtAt).getTime()   >= cutoff) ||
        (d.renewedAt  && new Date(d.renewedAt).getTime()  >= cutoff)
      ))
      .reduce((sum: number, d: any) => sum + Number(d.price || 0), 0)
    return { recurring, addon }
  } catch {
    return { recurring: 0, addon: 0 }
  }
}

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

function fmtNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString('it-IT')
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const cookieStore = await cookies()
  const resendPlanKey = (cookieStore.get('resend_plan')?.value ?? 'free') as ResendPlanKey
  const resendPlan = RESEND_PLANS[resendPlanKey] ?? RESEND_PLANS.free

  const sp = await searchParams
  const nowKey = new Date().toISOString().slice(0, 7)
  const monthStr = sp.month ?? nowKey
  const isCurrentMonth = monthStr === nowKey

  const { startMs, endMs } = getBillingPeriodMs(monthStr)
  const periodStartDate = new Date(startMs)
  const periodEndDate   = new Date(endMs - 1)
  const periodLabel = `${BILLING_DAY} ${periodStartDate.toLocaleDateString('it-IT', { month: 'long' })} – ${BILLING_DAY - 1} ${periodEndDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  // ── Static data (not period-dependent) ──────────────────────────────────────
  const [
    { count: totalUsers },
    { data: allTickets },
    totalStorageStats,
    dbSizeBytes,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabaseAdmin.from('tickets').select('created_at'),
    getTotalStorage().catch(() => ({ inputBytes: 0, dziBytes: 0, totalBytes: 0 })),
    supabaseAdmin.rpc('get_db_size_bytes').then(({ data }) => data as number | null, () => null),
  ])

  // ── Period-dependent data ────────────────────────────────────────────────────
  let vercelTotal = 0, vercelRecurring = 0, vercelAddon = 0
  let supabaseTotal = 0
  let resendTotal = 0, resendAddon = 0
  let emailsSent: number | null = null
  let egressBytes = 0
  let dataAvailable = false

  if (isCurrentMonth) {
    const startIso = new Date(startMs).toISOString()
    const endIso   = new Date(endMs).toISOString()

    const [cc, egressStats, vercelCosts] = await Promise.all([
      getCurrentCosts({ resendPlanKey }),
      getTotalEgress({ from: startIso, to: endIso }),
      getVercelMonthlyCost(),
    ])

    vercelTotal     = vercelCosts.recurring + vercelCosts.addon
    vercelRecurring = vercelCosts.recurring
    vercelAddon     = vercelCosts.addon
    supabaseTotal   = cc.supabase.total
    resendTotal     = cc.resend.total
    resendAddon     = cc.resend.addon
    emailsSent      = cc.resend.emailsSent
    egressBytes     = egressStats.totalBytes
    dataAvailable   = true
  } else {
    // Historical: try snapshot
    const { data: snap } = await supabaseAdmin
      .from('admin_billing_snapshots')
      .select('*')
      .eq('month', monthStr)
      .single()

    if (snap) {
      vercelTotal     = Number(snap.vercel_recurring) + Number(snap.vercel_addon)
      vercelRecurring = Number(snap.vercel_recurring)
      vercelAddon     = Number(snap.vercel_addon)
      supabaseTotal   = Number(snap.supabase_recurring) + Number(snap.supabase_addon)
      resendTotal     = Number(snap.resend_recurring) + Number(snap.resend_addon)
      resendAddon     = Number(snap.resend_addon)
      dataAvailable   = true
    }
  }

  const overageEmails = emailsSent !== null
    ? Math.max(0, emailsSent - resendPlan.quota)
    : 0

  return (
    <div className="py-10 px-8">

      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
          {todayCapitalized}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panoramica Histyon</h1>
      </div>

      {/* Utenti + Analisi */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <AdminStatCard
          label="Utenti registrati"
          value={totalUsers ?? 0}
          href="/ops-histyon-console/dashboard/users"
        />
        <AdminStatCard
          label="Analisi totali"
          value={(allTickets ?? []).length}
        />
      </div>

      {/* PostgreSQL + Storage */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        <AdminStatCard
          label="Database PostgreSQL"
          value={dbSizeBytes ?? 0}
          format="bytes"
        />
        <AdminStatCard
          label="Storage bucket"
          value={totalStorageStats.totalBytes}
          format="bytes"
        />
      </div>

      {/* ── Monthly section ────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-10">

        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Riepilogo mensile</h2>
          <span className="text-xs text-gray-400">{periodLabel}</span>
        </div>

        <Suspense>
          <MonthPicker minMonth={PROJECT_START} />
        </Suspense>

        {dataAvailable ? (
          <>
            {/* Email + Egress */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 bg-white px-6 py-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
                  Email inviate
                </p>
                <p className="text-3xl font-bold tabular-nums text-gray-900">
                  {emailsSent !== null ? fmtNum(emailsSent) : '—'}
                </p>
                {emailsSent !== null && (
                  <p className="text-xs text-gray-400 mt-2">
                    {fmtNum(Math.max(0, resendPlan.quota - emailsSent))} rimanenti su quota {fmtNum(resendPlan.quota)}
                  </p>
                )}
              </div>
              <div className="border border-gray-200 bg-white px-6 py-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
                  Egress Storage
                </p>
                <p className="text-3xl font-bold tabular-nums text-gray-900">
                  {formatBytes(egressBytes)}
                </p>
                <p className="text-xs text-gray-400 mt-2">traffico in uscita dal bucket</p>
              </div>
            </div>

            {/* Cost boxes per platform */}
            <div className="grid grid-cols-3 gap-4 mb-8">

              {/* Vercel */}
              <div className="border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-gray-900 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 116 100" fill="white" className="w-3 h-3">
                      <path d="M57.5 15L100 85H15L57.5 15Z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-900">Vercel</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-gray-900">${vercelTotal.toFixed(2)}</p>
                <div className="mt-2 space-y-0.5">
                  {vercelRecurring > 0 && (
                    <p className="text-[10px] text-gray-400">Pro ${vercelRecurring.toFixed(2)}</p>
                  )}
                  {vercelAddon > 0 && (
                    <p className="text-[10px] text-gray-400">domini ${vercelAddon.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* Supabase */}
              <div className="border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-[#3ECF8E] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 109 113" fill="none" className="w-3 h-3">
                      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="white" />
                      <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="white" fillOpacity="0.7" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-gray-900">Supabase</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-gray-900">${supabaseTotal.toFixed(2)}</p>
                <p className="text-[10px] text-gray-400 mt-2">Piano Pro mensile</p>
              </div>

              {/* Resend */}
              <div className="border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-black flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-[10px] leading-none select-none">R</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">Resend</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-gray-900">${resendTotal.toFixed(2)}</p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[10px] text-gray-400">Piano {resendPlan.label} ${resendPlan.price.toFixed(2)}</p>
                  {resendAddon > 0 && (
                    <p className="text-[10px] text-gray-400">overage ${resendAddon.toFixed(2)}</p>
                  )}
                </div>
              </div>

            </div>

            {/* Bar chart */}
            <CostBarChart
              data={[
                { service: 'Vercel',   cost: vercelTotal,   color: '#111827' },
                { service: 'Supabase', cost: supabaseTotal, color: '#3ECF8E' },
                { service: 'Resend',   cost: resendTotal,   color: '#6366F1' },
              ]}
              periodLabel={periodLabel}
            />
          </>
        ) : (
          <div className="border border-gray-200 bg-white px-8 py-10 text-center">
            <p className="text-sm text-gray-400">Nessun dato disponibile per questo periodo.</p>
            <p className="text-[11px] text-gray-300 mt-1">
              Lo snapshot viene salvato automaticamente il giorno {BILLING_DAY} di ogni mese.
            </p>
          </div>
        )}

      </div>

      {/* ── Resend plan selector ───────────────────────────────────────────── */}
      <div className="mt-12 pt-6 border-t border-gray-100">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
          Piano Resend attivo
        </p>
        <ResendPlanSelector currentPlan={resendPlanKey} />
        <div className="mt-3 space-y-1">
          <p className="text-xs text-gray-500">
            Ciclo {periodLabel}:{' '}
            <strong className="text-gray-700">${resendPlan.price.toFixed(2)}</strong> (piano {resendPlan.label})
            {resendAddon > 0 && (
              <> + <strong className="text-gray-700">${resendAddon.toFixed(2)}</strong> overage</>
            )}
          </p>
          {overageEmails > 0 && (
            <p className="text-xs text-gray-500">
              Email oltre quota: <strong className="text-gray-700">{fmtNum(overageEmails)}</strong> ×{' '}
              ${(RESEND_OVERAGE_RATE / 1000).toFixed(4)}/email
            </p>
          )}
          <p className="text-[11px] text-gray-400">
            Stima overage: $0.90 per ogni 1.000 email oltre la quota del piano
          </p>
        </div>
      </div>

    </div>
  )
}
