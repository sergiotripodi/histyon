import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { getTotalStorage } from '@/lib/usage/storage'
import { RESEND_PLANS, type ResendPlanKey } from '@/lib/resend/plans'

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

async function getResendEmailsSent(): Promise<number | null> {
  const key = process.env.ADMIN_RESEND_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'histyon-admin/1.0' },
      next: { revalidate: 300 },
    })
    const raw = res.headers.get('x-resend-monthly-quota')
    const n = raw ? Number(raw.split('/')[0]) : null
    return n !== null && !isNaN(n) ? n : null
  } catch { return null }
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
    resendEmailsSent,
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

  const tickets = allTickets ?? []
  const last7 = last30.slice(-7)
  const sevenDaysAgo = `${last7[0]}T00:00:00.000Z`
  const recentUsers7  = (recentUsers ?? []).filter(r => r.created_at >= sevenDaysAgo)
  const recentTickets7 = (recentTickets ?? []).filter(r => r.created_at >= sevenDaysAgo)

  const userSparkline   = groupByDay(recentUsers7, last7)
  const ticketSparkline = groupByDay(recentTickets7, last7)
  const storageSparkline = last7.map(() => 0)

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  // Calcolo costi attuali per i badge
  const vercelMonthlyCost   = vercelPlan === 'pro' ? 20 : 0
  const supabaseMonthlyCost = 0 // free plan
  const resendMonthlyCost   = resendPlan.price

  return (
    <div className="py-10 px-8">
      <div className="flex items-end justify-between pb-8 mb-8 border-b border-gray-100">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
            {todayCapitalized}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Panoramica Histyon.
          </h1>
        </div>
      </div>

      {/* Stat cards */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Statistiche piattaforma
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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
        <AdminStatCard
          label="Database PostgreSQL"
          value={dbSizeBytes ?? 0}
          sparkline={storageSparkline}
          format="bytes"
          href="/ops-histyon-console/dashboard/supabase"
        />
        <AdminStatCard
          label="Storage bucket"
          value={totalStorageStats.totalBytes}
          sparkline={storageSparkline}
          format="bytes"
          href="/ops-histyon-console/dashboard/supabase"
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
          <p className="text-xs text-gray-400 mb-3">Hosting, deployment e domini</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>${vercelMonthlyCost}/mese</span>
            <span className="text-green-600 font-medium">● Online</span>
          </div>
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
          <p className="text-xs text-gray-400 mb-3">Database, autenticazione e storage</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>${supabaseMonthlyCost}/mese</span>
            <span className="text-green-600 font-medium">● Active Healthy</span>
          </div>
        </a>

        {/* Resend */}
        <a href="/ops-histyon-console/dashboard/resend" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-black flex items-center justify-center">
                <span className="text-white text-[10px] font-black tracking-tighter">R</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Resend</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              {resendPlanKey.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Email transazionali e marketing</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {resendEmailsSent !== null
                ? `${resendEmailsSent.toLocaleString('it-IT')} email/mese`
                : `${resendPlan.quota.toLocaleString('it-IT')} email quota`
              }
            </span>
            <span className="text-gray-500">${resendMonthlyCost}/mese</span>
          </div>
        </a>
      </div>
    </div>
  )
}
