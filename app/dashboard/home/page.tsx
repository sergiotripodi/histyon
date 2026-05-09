import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatCard } from '@/components/dashboard/StatCard'
import { getDictionary } from '@/lib/dictionary'

export const dynamic = 'force-dynamic'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function groupByDay<T extends { created_at: string }>(
  rows: T[],
  days: string[],
  getValue: (row: T) => number = () => 1
): number[] {
  const map: Record<string, number> = {}
  for (const row of rows) {
    const day = row.created_at.slice(0, 10)
    map[day] = (map[day] ?? 0) + getValue(row)
  }
  return days.map((d) => map[d] ?? 0)
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`
  return `${bytes} B`
}

export default async function DashboardHomePage() {
  const dict = await getDictionary()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_name, first_name')
    .eq('id', user.id)
    .single()

  const last7 = getLast7Days()
  const sevenDaysAgo = `${last7[0]}T00:00:00.000Z`

  // All tickets — for totals + sparklines
  const [{ data: allTickets }, { data: recentPatients }, { count: totalPatients }] =
    await Promise.all([
      supabase
        .from('tickets')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('patients')
        .select('created_at')
        .eq('doctor_id', user.id)
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id),
    ])

  const tickets = allTickets ?? []

  const isError = (s: string) =>
    ['ERROR', 'FAILED', 'FAIL', 'FAILED_ANALYSIS', 'ANALYSIS_FAILED'].includes((s ?? '').toUpperCase())

  const totalAnalyses = tickets.length
  const completed = tickets.filter((t) => t.status === 'COMPLETED').length
  const inProgress = tickets.filter((t) =>
    ['QUEUED', 'PROCESSING', 'UPLOADING'].includes(t.status) && !isError(t.status)
  ).length
  const failed = tickets.filter((t) => isError(t.status)).length
  const storageBytes = tickets.reduce(
    (s, t) => s + (t.file_size ?? 0) + (t.output_file_size ?? 0),
    0
  )

  // Sparklines (7 days)
  const recentTickets = tickets.filter((t) => t.created_at >= sevenDaysAgo)
  const totalSparkline = groupByDay(recentTickets, last7)
  const completedSparkline = groupByDay(
    recentTickets.filter((t) => t.status === 'COMPLETED'),
    last7
  )
  const inProgressSparkline = groupByDay(
    recentTickets.filter((t) => ['QUEUED', 'PROCESSING', 'UPLOADING'].includes(t.status) && !isError(t.status)),
    last7
  )
  const failedSparkline = groupByDay(
    recentTickets.filter((t) => isError(t.status)),
    last7
  )
  const storageSparkline = groupByDay(recentTickets, last7, (t) => t.file_size ?? 0)
  const patientSparkline = groupByDay(recentPatients ?? [], last7)

  // Weekly change
  const thisWeekAnalyses = recentTickets.length
  const thisWeekPatients = recentPatients?.length ?? 0

  const displayName = profile?.last_name
    ? `Dr. ${profile.last_name}`
    : user.email?.split('@')[0] ?? ''

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  const cards = [
    {
      label: 'Analisi totali',
      value: totalAnalyses,
      sparkline: totalSparkline,
      subtitle: `+${thisWeekAnalyses} questa settimana`,
    },
    {
      label: 'Pazienti registrati',
      value: totalPatients ?? 0,
      sparkline: patientSparkline,
      subtitle: `+${thisWeekPatients} questa settimana`,
    },
    {
      label: 'Completate',
      value: completed,
      sparkline: completedSparkline,
      subtitle: completed > 0 ? `${Math.round((completed / Math.max(totalAnalyses, 1)) * 100)}% del totale` : undefined,
    },
    {
      label: 'In elaborazione',
      value: inProgress,
      sparkline: inProgressSparkline,
      subtitle: inProgress > 0 ? `${inProgress} in coda o in corso` : 'Nessuna in corso',
    },
    {
      label: 'Fallite',
      value: failed,
      sparkline: failedSparkline,
      subtitle: failed > 0 ? `${Math.round((failed / Math.max(totalAnalyses, 1)) * 100)}% del totale` : 'Nessun errore',
      accent: failed > 0 ? 'red' : 'default',
    },
    {
      label: 'Spazio utilizzato',
      value: storageBytes,
      sparkline: storageSparkline,
      subtitle: formatBytes(storageBytes),
      format: 'bytes' as const,
    },
  ] as const

  return (
    <div className="layout-container py-10">
      {/* Header */}
      <div className="flex items-end justify-between pb-8 mb-8 border-b border-gray-100">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
            {todayCapitalized}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Panoramica, {displayName}.
          </h1>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            sparkline={[...card.sparkline]}
            subtitle={'subtitle' in card ? card.subtitle : undefined}
            format={'format' in card ? card.format : 'number'}
            accent={('accent' in card ? card.accent : 'default') as 'default' | 'red'}
          />
        ))}
      </div>
    </div>
  )
}
