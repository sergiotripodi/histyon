import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimeChart } from '@/components/admin/TimeChart'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Utenti — Console Histyon' }

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

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const days = getLast90Days()
  const since = `${days[0].key}T00:00:00.000Z`

  const [
    { count: totalUsers },
    { data: allUsers },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('profiles')
      .select('id, email, first_name, last_name, created_at, hospital_name')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('profiles')
      .select('created_at')
      .neq('role', 'admin')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
  ])

  // Aggregate by day
  const dayMap: Record<string, number> = {}
  for (const u of recentUsers ?? []) {
    const day = u.created_at.slice(0, 10)
    dayMap[day] = (dayMap[day] ?? 0) + 1
  }

  // Cumulative chart: total users over time (running total from oldest)
  let running = (totalUsers ?? 0) - (recentUsers?.length ?? 0)
  const chartData = days.map(d => {
    running += dayMap[d.key] ?? 0
    return { label: d.label, value: running }
  })

  // New users per day (last 30)
  const newPerDay = days.slice(-30).map(d => ({
    label: d.label,
    value: dayMap[d.key] ?? 0,
  }))

  const thisMonth = (recentUsers ?? []).filter(u => {
    const d = new Date(u.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="py-10 px-8">
      {/* Back */}
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">Statistiche</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Utenti registrati</h1>
      </div>

      {/* Totals row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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

      {/* Cumulative chart */}
      <div className="border border-gray-200 bg-white p-6 mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-6">
          Crescita utenti — ultimi 90 giorni
        </p>
        <TimeChart data={chartData} height={160} />
      </div>

      {/* New per day chart */}
      <div className="border border-gray-200 bg-white p-6 mb-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-6">
          Nuovi utenti al giorno — ultimi 30 giorni
        </p>
        <TimeChart data={newPerDay} height={120} />
      </div>

      {/* User list */}
      <div className="border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Ultimi 50 utenti registrati
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Nome', 'Email', 'Ospedale', 'Registrato il'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(allUsers ?? []).map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-medium text-gray-900">
                  {u.first_name && u.last_name ? `Dr. ${u.last_name}` : u.first_name ?? '—'}
                </td>
                <td className="px-6 py-3 text-gray-500">{u.email}</td>
                <td className="px-6 py-3 text-gray-400">{u.hospital_name ?? '—'}</td>
                <td className="px-6 py-3 text-gray-400 font-mono text-xs">
                  {new Date(u.created_at).toLocaleDateString('it-IT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
