import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { PaymentBanner } from '@/components/admin/PaymentBanner'
import { getTotalStorage } from '@/lib/usage/storage'
import { RESEND_PLANS, type ResendPlanKey } from '@/lib/resend/plans'
import { PROJECT_START, getBillingPeriodMs } from '@/lib/billing/config'

function computeHistoricalTotal(recurringCost: number): number {
  const start = new Date(PROJECT_START + '-01')
  const now = new Date()
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) + 1
  return Math.max(1, monthsElapsed) * recurringCost
}

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

function groupByDay<T extends { created_at: string }>(
  rows: T[],
  days: string[],
): number[] {
  const map: Record<string, number> = {}
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    map[day] = (map[day] ?? 0) + 1
  }
  return days.map(d => map[d] ?? 0)
}

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

async function getVercelPlan(): Promise<string> {
  try {
    const res = await fetch(
      `https://api.vercel.com/v1/teams/${process.env.ADMIN_VERCEL_TEAM_ID}`,
      { headers: { Authorization: `Bearer ${process.env.ADMIN_VERCEL_TOKEN}` }, next: { revalidate: 3600 } }
    )
    const json = await res.json()
    return json?.billing?.plan ?? 'hobby'
  } catch { return 'hobby' }
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

async function getResendEmailsSent(): Promise<{ total: number | null; sparkline: number[] }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { total: null, sparkline: [] }
  // Periodo di fatturazione corrente (24→23), non mese solare
  const { startMs, endMs } = getBillingPeriodMs()
  const monthStart = new Date(startMs)
  const monthEnd   = new Date(endMs)
  // Ultimi 7 giorni per la sparkline
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const dayMap: Record<string, number> = {}
  try {
    let total = 0, offset = 0
    for (let page = 0; page < 5; page++) {
      const res = await fetch(`https://api.resend.com/emails?limit=100&offset=${offset}`, {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 300 },
      })
      if (!res.ok) break
      const emails: any[] = (await res.json()).data ?? []
      if (!emails.length) break
      let done = false
      for (const e of emails) {
        const created = parseResendDate(e.created_at)
        if (!created) continue
        if (created >= monthStart && created < monthEnd) {
          total++
          const day = created.toISOString().slice(0, 10)
          dayMap[day] = (dayMap[day] ?? 0) + 1
        } else if (created < monthStart) { done = true; break }
      }
      if (done || emails.length < 100) break
      offset += 100
    }
    return { total, sparkline: last7.map(d => dayMap[d] ?? 0) }
  } catch { return { total: null, sparkline: [] } }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const cookieStore = await cookies()
  const resendPlanKey = (cookieStore.get('resend_plan')?.value ?? 'free') as ResendPlanKey
  const resendPlan = RESEND_PLANS[resendPlanKey] ?? RESEND_PLANS.free

  const last30 = getLast30Days()
  const thirtyDaysAgo = `${last30[0]}T00:00:00.000Z`

  const [
    { count: totalUsers },
    { data: allTickets },
    { data: recentUsers },
    { data: recentTickets },
    vercelPlan,
    totalStorageStats,
    dbSizeBytes,
    resendResult,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabaseAdmin.from('tickets').select('created_at, status').order('created_at', { ascending: true }),
    supabaseAdmin.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo).neq('role', 'admin'),
    supabaseAdmin.from('tickets').select('created_at, status').gte('created_at', thirtyDaysAgo),
    getVercelPlan(),
    getTotalStorage().catch(() => ({ inputBytes: 0, dziBytes: 0, totalBytes: 0 })),
    supabaseAdmin.rpc('get_db_size_bytes').then(({ data }) => data as number | null, () => null),
    getResendEmailsSent(),
  ])

  const resendEmailsSent = resendResult.total
  const resendSparkline  = resendResult.sparkline

  const tickets = allTickets ?? []
  const last7 = last30.slice(-7)
  const sevenDaysAgo = `${last7[0]}T00:00:00.000Z`
  const recentUsers7  = (recentUsers ?? []).filter(r => r.created_at >= sevenDaysAgo)
  const recentTickets7 = (recentTickets ?? []).filter(r => r.created_at >= sevenDaysAgo)

  const userSparkline   = groupByDay(recentUsers7, last7)
  const ticketSparkline = groupByDay(recentTickets7, last7)


  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  // Calcolo costi attuali per i badge
  const vercelMonthlyCost   = vercelPlan !== 'hobby' && vercelPlan !== 'free' ? 20 : 0
  const supabaseMonthlyCost = 25 // Supabase Pro
  const resendMonthlyCost   = resendPlan.price
  const recurringCost       = vercelMonthlyCost + supabaseMonthlyCost + resendMonthlyCost
  const historicalTotal     = computeHistoricalTotal(recurringCost)

  return (
    <div className="py-10 px-8">
      <div className="flex items-end justify-between pb-8 mb-8 border-b border-gray-100">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
            {todayCapitalized}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Panoramica Histyon
          </h1>
        </div>
      </div>

      {/* Payment banner */}
      <PaymentBanner
        monthlyRecurring={recurringCost}
        historicalTotal={historicalTotal}
      />

      {/* Stat cards */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Statistiche piattaforma
      </h2>
      {/* Riga 1: metriche piattaforma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <AdminStatCard
          label="Utenti registrati"
          value={totalUsers ?? 0}
          sparkline={userSparkline}
          href="/ops-histyon-console/dashboard/users"
        />
        <AdminStatCard
          label="Analisi totali"
          value={tickets.length}
          sparkline={ticketSparkline}
          href="/ops-histyon-console/dashboard/analyses"
        />
      </div>

      {/* Riga 2: infrastruttura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AdminStatCard
          label="Database PostgreSQL"
          value={dbSizeBytes ?? 0}
          format="bytes"
          href="/ops-histyon-console/dashboard/supabase"
        />
        <AdminStatCard
          label="Storage bucket"
          value={totalStorageStats.totalBytes}
          format="bytes"
          href="/ops-histyon-console/dashboard/supabase"
        />
        <AdminStatCard
          label="Email inviate"
          value={resendEmailsSent ?? 0}
          sparkline={resendSparkline}
          href="/ops-histyon-console/dashboard/resend"
        />
      </div>

      {/* Service cards */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Servizi
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Vercel */}
        <a href="/ops-histyon-console/dashboard/vercel" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gray-900 flex items-center justify-center">
                <svg viewBox="0 0 116 100" fill="white" className="w-3.5 h-3.5">
                  <path d="M57.5 15L100 85H15L57.5 15Z"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">Vercel</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              {vercelPlan}
            </span>
          </div>
          <p className="text-xs text-gray-400">Hosting, deployment e domini</p>
        </a>

        {/* Supabase */}
        <a href="/ops-histyon-console/dashboard/supabase" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#3ECF8E] flex items-center justify-center">
                <svg viewBox="0 0 109 113" fill="none" className="w-3.5 h-3.5">
                  <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="white"/>
                  <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="white" fillOpacity="0.7"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">Supabase</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              free
            </span>
          </div>
          <p className="text-xs text-gray-400">Database, autenticazione e storage</p>
        </a>

        {/* Resend */}
        <a href="/ops-histyon-console/dashboard/resend" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-black flex items-center justify-center">
                <span className="text-white font-black text-[13px] leading-none select-none">R</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Resend</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              {resendPlanKey.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-400">Email transazionali e marketing</p>
        </a>
      </div>
    </div>
  )
}
