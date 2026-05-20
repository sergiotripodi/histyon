import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { TimeChart } from '@/components/admin/TimeChart'
import Link from 'next/link'
import { getAllDoctorsStorage } from '@/lib/usage/storage'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Utenti — Console Histyon' }

type TicketRow = {
  doctor_id: string | null
  status: string | null
  created_at: string
}

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return b > 0 ? `${b} B` : '—'
}

function getLast90Days(): { key: string; label: string }[] {
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (89 - i))
    return {
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
    }
  })
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ metric?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const days = getLast90Days()
  const since = `${days[0].key}T00:00:00.000Z`
  const sp = await searchParams
  const activeMetric = sp.metric === 'analyses' ? 'analyses' : 'users'

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: totalUsers },
    { data: allUsers },
    { data: recentUsers },
    { data: allTickets },
    { data: recentTickets },
    egressLogsResult,
    doctorStorageRows,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabaseAdmin.from('profiles')
      .select('id, email, first_name, last_name, created_at, hospital_name')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin.from('profiles')
      .select('created_at')
      .neq('role', 'admin')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('tickets')
      .select('doctor_id, status, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('tickets')
      .select('created_at, status')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('egress_logs')
      .select('doctor_id, bytes')
      .gte('created_at', startOfMonth),
    getAllDoctorsStorage().catch(() => []),
  ])

  // Build storage map from real storage lib
  const storageByUser: Record<string, number> = {}
  for (const row of doctorStorageRows) {
    storageByUser[row.doctorId] = row.totalBytes
  }

  // Build egress map from egress_logs
  const egressByUser: Record<string, number> = {}
  for (const row of (egressLogsResult.data ?? [])) {
    const uid = (row as any).doctor_id
    if (!uid) continue
    egressByUser[uid] = (egressByUser[uid] ?? 0) + ((row as any).bytes ?? 0)
  }

  // Aggregate analyses count per user
  const analysesByUser: Record<string, number> = {}
  const tickets = (allTickets ?? []) as TicketRow[]
  for (const t of tickets) {
    const uid = t.doctor_id
    if (!uid) continue
    analysesByUser[uid] = (analysesByUser[uid] ?? 0) + 1
  }

  const completed = tickets.filter(t => t.status === 'COMPLETED').length
  const failed = tickets.filter(t => ['FAILED', 'ERROR'].includes(t.status ?? '')).length

  const dayMap: Record<string, number> = {}
  for (const u of recentUsers ?? []) {
    const day = u.created_at.slice(0, 10)
    dayMap[day] = (dayMap[day] ?? 0) + 1
  }

  const analysisDayMap: Record<string, number> = {}
  for (const t of recentTickets ?? []) {
    const day = t.created_at.slice(0, 10)
    analysisDayMap[day] = (analysisDayMap[day] ?? 0) + 1
  }

  let running = (totalUsers ?? 0) - (recentUsers?.length ?? 0)
  const usersChartData = days.map(d => {
    running += dayMap[d.key] ?? 0
    return { label: d.label, value: running }
  })
  const analysesChartData = days.map(d => ({ label: d.label, value: analysisDayMap[d.key] ?? 0 }))
  const chartData = activeMetric === 'analyses' ? analysesChartData : usersChartData

  const thisMonth = (recentUsers ?? []).filter(u => {
    const d = new Date(u.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="py-10 px-8">
      <div className="pb-8 mb-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Utenti</h1>
      </div>

      {/* Row 1 — Utenti (3 boxes) */}
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-3">Utenti</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Totale utenti', value: (totalUsers ?? 0).toLocaleString('it-IT') },
          { label: 'Nuovi questo mese', value: thisMonth.toLocaleString('it-IT') },
          { label: 'Nuovi ultimi 90 giorni', value: (recentUsers?.length ?? 0).toLocaleString('it-IT') },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 bg-white px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">{label}</p>
            <p className="text-3xl font-bold tabular-nums text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Row 2 — Analisi effettuate (3 boxes) */}
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-3">Analisi effettuate</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Totale analisi', value: tickets.length.toLocaleString('it-IT') },
          { label: 'Analisi completate', value: completed.toLocaleString('it-IT') },
          { label: 'Analisi fallite', value: failed.toLocaleString('it-IT'), red: failed > 0 },
        ].map(({ label, value, red }) => (
          <div key={label} className="border border-gray-200 bg-white px-6 py-5">
            <p className={`text-[10px] font-medium uppercase tracking-[0.14em] mb-2 ${red ? 'text-red-400' : 'text-gray-400'}`}>{label}</p>
            <p className={`text-3xl font-bold tabular-nums ${red ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="border border-gray-200 bg-white mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Ultimi 50 utenti registrati · analisi, storage ed egress per utente
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Nome', 'Analisi', 'Storage', 'Egress mese', 'Email', 'Ospedale', 'Registrato il'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(allUsers ?? []).map(u => {
              const userAnalyses = analysesByUser[u.id] ?? 0
              const userStorage  = storageByUser[u.id] ?? 0
              const userEgress   = egressByUser[u.id] ?? 0
              return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {u.first_name && u.last_name ? `Dr. ${u.last_name}` : u.first_name ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-xs font-mono text-gray-700">
                    {userAnalyses > 0 ? userAnalyses.toLocaleString('it-IT') : '—'}
                  </td>
                  <td className="px-6 py-3 text-xs font-mono text-gray-500">
                    {formatBytes(userStorage)}
                  </td>
                  <td className="px-6 py-3 text-xs font-mono text-gray-500">
                    {userEgress > 0 ? formatBytes(userEgress) : '—'}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{u.email}</td>
                  <td className="px-6 py-3 text-gray-400">{u.hospital_name ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-400 font-mono text-xs">
                    {new Date(u.created_at).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Trend</h2>
        <div className="inline-flex border border-gray-200 bg-white">
          {[
            { key: 'users', label: 'Utenti' },
            { key: 'analyses', label: 'Analisi effettuate' },
          ].map(tab => {
            const isActive = activeMetric === tab.key
            return (
              <Link
                key={tab.key}
                href={`/ops-histyon-console/dashboard/users?metric=${tab.key}`}
                className={`px-4 py-2 text-xs font-medium transition-colors ${isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
      <div className="border border-gray-200 bg-white p-6 mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-6">
          {activeMetric === 'analyses' ? 'Analisi effettuate per giorno' : 'Crescita utenti'} — ultimi 90 giorni
        </p>
        <TimeChart data={chartData} height={160} />
      </div>
    </div>
  )
}
