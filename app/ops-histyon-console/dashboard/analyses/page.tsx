import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { TimeChart } from '@/components/admin/TimeChart'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analisi' }

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

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completata',
  PROCESSING: 'In elaborazione',
  QUEUED: 'In coda',
  UPLOADING: 'Upload',
  FAILED: 'Fallita',
  DOWNLOADED: 'Scaricata',
}

export default async function AdminAnalysesPage() {
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

  const [{ data: allTickets }, { data: recentTickets }] = await Promise.all([
    supabaseAdmin.from('tickets').select('id, status, created_at').order('created_at', { ascending: false }),
    supabaseAdmin.from('tickets').select('created_at, status').gte('created_at', since).order('created_at', { ascending: true }),
  ])

  const tickets = allTickets ?? []
  const completed = tickets.filter(t => t.status === 'COMPLETED')
  const failed = tickets.filter(t => ['FAILED', 'ERROR'].includes(t.status ?? ''))
  const totalStorage = 0 // file_size removed from tickets table

  const dayMap: Record<string, number> = {}
  const completedDayMap: Record<string, number> = {}
  for (const t of recentTickets ?? []) {
    const day = t.created_at.slice(0, 10)
    dayMap[day] = (dayMap[day] ?? 0) + 1
    if (t.status === 'COMPLETED') completedDayMap[day] = (completedDayMap[day] ?? 0) + 1
  }

  const chartDataTotal = days.map(d => ({ label: d.label, value: dayMap[d.key] ?? 0 }))
  const chartDataCompleted = days.map(d => ({ label: d.label, value: completedDayMap[d.key] ?? 0 }))

  const thisMonth = (recentTickets ?? []).filter(t => {
    const d = new Date(t.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="py-10 px-8">
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <div className="pb-8 mb-8 border-b border-gray-100">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">Statistiche</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analisi effettuate</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Totale analisi', value: tickets.length.toLocaleString('it-IT') },
          { label: 'Completate', value: completed.length.toLocaleString('it-IT') },
          { label: 'Fallite', value: failed.length.toLocaleString('it-IT'), red: true },
          { label: 'Storage totale', value: formatBytes(totalStorage) },
        ].map(({ label, value, red }) => (
          <div key={label} className="border border-gray-200 bg-white px-6 py-5">
            <p className={`text-[10px] font-medium uppercase tracking-[0.14em] mb-2 ${red ? 'text-red-400' : 'text-gray-400'}`}>{label}</p>
            <p className={`text-3xl font-bold tabular-nums ${red && failed.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 bg-white p-6 mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-6">
          Analisi totali per giorno — ultimi 90 giorni
        </p>
        <TimeChart data={chartDataTotal} height={160} />
      </div>

      <div className="border border-gray-200 bg-white p-6 mb-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-6">
          Analisi completate per giorno — ultimi 90 giorni
        </p>
        <TimeChart data={chartDataCompleted} height={120} />
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Ultime 50 analisi
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['ID', 'Stato', 'Dimensione file', 'Data'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.slice(0, 50).map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-gray-400">{t.id.slice(0, 8)}…</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 border ${
                    t.status === 'COMPLETED' ? 'border-green-200 text-green-700 bg-green-50'
                    : t.status === 'FAILED' ? 'border-red-200 text-red-600 bg-red-50'
                    : 'border-gray-200 text-gray-500 bg-gray-50'
                  }`}>
                    {STATUS_LABELS[t.status ?? ''] ?? t.status ?? '—'}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-400 text-xs">—</td>
                <td className="px-6 py-3 text-gray-400 font-mono text-xs">
                  {new Date(t.created_at).toLocaleDateString('it-IT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
