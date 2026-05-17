import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { PaymentBanner } from '@/components/admin/PaymentBanner'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Console — Histyon' }

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
  getValue: (r: T) => number = () => 1
): number[] {
  const map: Record<string, number> = {}
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    map[day] = (map[day] ?? 0) + getValue(r)
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

async function getCloudflarePlan(): Promise<string> {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.ADMIN_CLOUDFLARE_ACCOUNT_ID}`,
      { headers: { Authorization: `Bearer ${process.env.ADMIN_CLOUDFLARE_TOKEN}` }, next: { revalidate: 3600 } }
    )
    const json = await res.json()
    return json?.result?.type ?? 'standard'
  } catch { return 'standard' }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const last30 = getLast30Days()
  const thirtyDaysAgo = `${last30[0]}T00:00:00.000Z`

  const [
    { count: totalUsers },
    { data: allTickets },
    { data: recentUsers },
    { data: recentTickets },
    vercelPlan,
    cfPlan,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('tickets').select('created_at, file_size, status').order('created_at', { ascending: true }),
    supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo).neq('role', 'admin'),
    supabase.from('tickets').select('created_at, status').gte('created_at', thirtyDaysAgo),
    getVercelPlan(),
    getCloudflarePlan(),
  ])

  const tickets = allTickets ?? []
  const completedTickets = tickets.filter(t => t.status === 'COMPLETED')
  const totalStorage = tickets.reduce((s, t) => s + (t.file_size ?? 0), 0)

  // Sparklines (last 30 days, show last 7 for the small card)
  const last7 = last30.slice(-7)
  const sevenDaysAgo = `${last7[0]}T00:00:00.000Z`
  const recentUsers7 = (recentUsers ?? []).filter(r => r.created_at >= sevenDaysAgo)
  const recentTickets7 = (recentTickets ?? []).filter(r => r.created_at >= sevenDaysAgo)
  const recentCompleted7 = recentTickets7.filter(t => t.status === 'COMPLETED')

  const userSparkline = groupByDay(recentUsers7, last7)
  const ticketSparkline = groupByDay(recentTickets7, last7)
  const completedSparkline = groupByDay(recentCompleted7, last7)
  const storageSparkline = groupByDay(
    (recentTickets ?? []).filter(r => r.created_at >= sevenDaysAgo),
    last7,
    t => (t as any).file_size ?? 0
  )

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  // Cost calculation (free plans = $0, but structure is ready)
  const vercelMonthlyCost = vercelPlan === 'pro' ? 20 : 0
  const supabaseMonthlyCost = 0 // Free plan
  const cfMonthlyCost = 0 // Free plan (R2 has usage-based costs but negligible at this scale)
  const totalMonthlyCost = vercelMonthlyCost + supabaseMonthlyCost + cfMonthlyCost

  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="flex items-end justify-between pb-8 mb-8 border-b border-gray-100">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
            {todayCapitalized}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Panoramica Histyon.
          </h1>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-2.5 py-1.5 text-gray-500">
            Vercel {vercelPlan.charAt(0).toUpperCase() + vercelPlan.slice(1)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-2.5 py-1.5 text-gray-500">
            Supabase Free
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-2.5 py-1.5 text-gray-500">
            Cloudflare {cfPlan.charAt(0).toUpperCase() + cfPlan.slice(1)}
          </span>
        </div>
      </div>

      {/* Payment banner */}
      <div className="mb-6">
        <PaymentBanner
          totalAccrued={totalMonthlyCost}
          totalSpentAllTime={totalMonthlyCost}
          nextPaymentDate={vercelPlan === 'pro' ? '1 giugno 2026' : null}
          nextPaymentAmount={vercelMonthlyCost}
          nextPaymentLabel={vercelPlan === 'pro' ? 'Piano Vercel Pro mensile' : null}
        />
      </div>

      {/* Platform stats */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Statistiche piattaforma
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <AdminStatCard
          label="Utenti registrati"
          value={totalUsers ?? 0}
          sparkline={userSparkline}
          subtitle={`+${recentUsers7.length} ultimi 7 giorni`}
          href="/ops-histyon-console/dashboard/users"
        />
        <AdminStatCard
          label="Analisi totali"
          value={tickets.length}
          sparkline={ticketSparkline}
          subtitle={`${tickets.length} totali`}
          href="/ops-histyon-console/dashboard/analyses"
        />
        <AdminStatCard
          label="Analisi completate"
          value={completedTickets.length}
          sparkline={completedSparkline}
          subtitle={`${tickets.length > 0 ? Math.round((completedTickets.length / tickets.length) * 100) : 0}% del totale`}
          href="/ops-histyon-console/dashboard/analyses"
        />
        <AdminStatCard
          label="Storage utilizzato"
          value={totalStorage}
          sparkline={storageSparkline}
          subtitle={formatBytes(totalStorage)}
          format="bytes"
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
                <span className="text-white text-[10px] font-bold">▲</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Vercel</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              {vercelPlan}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Hosting, deployment e domini</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>histyon.com</span>
            <span className="text-green-600 font-medium">● Online</span>
          </div>
        </a>

        {/* Supabase */}
        <a href="/ops-histyon-console/dashboard/supabase" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#3ECF8E] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">S</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Supabase</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              free
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Database, autenticazione e storage</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{totalUsers ?? 0} utenti</span>
            <span className="text-green-600 font-medium">● Active Healthy</span>
          </div>
        </a>

        {/* Cloudflare */}
        <a href="/ops-histyon-console/dashboard/cloudflare" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#F48120] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">CF</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Cloudflare</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              {cfPlan}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">R2 Storage, DNS e protezione</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>R2 Paid attivo</span>
            <span className="text-amber-500 font-medium">● Dominio non su CF</span>
          </div>
        </a>
      </div>
    </div>
  )
}
