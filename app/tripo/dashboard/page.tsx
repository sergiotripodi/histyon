import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { MonthPicker } from '@/components/admin/MonthPicker'
import { TrendSection } from '@/components/admin/TrendSection'
import { UsersTable, type UserRow } from '@/components/admin/UsersTable'
import { getTotalStorage, getAllDoctorsStorage } from '@/lib/usage/storage'
import { getTotalEgress } from '@/lib/usage/egress'
import { getPeriodMs, getBillingPeriodMs, RESEND_RESET_DAY, PROJECT_START } from '@/lib/billing/config'
import { countResendEmailsForPeriod } from '@/lib/billing/current-costs'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

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

type EgressLogRow = { doctor_id: string | null; bytes: number | null }
type UserProfile  = {
  id:                    string
  email:                 string | null
  first_name:            string | null
  last_name:             string | null
  hospital_name:         string | null
  created_at:            string
  status:                string
  deletion_scheduled_at: string | null
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/tripo/login')

  const supabaseAdmin = createAdminClient()

  const sp = await searchParams
  const nowKey = new Date().toISOString().slice(0, 7)
  const monthStr = sp.month ?? nowKey
  const isCurrentMonth = monthStr === nowKey

  const [periodY, periodMo] = monthStr.split('-').map(Number)
  const periodLabel =
    new Date(Date.UTC(periodY, periodMo - 1, 1)).toLocaleDateString('it-IT', { month: 'long' }) +
    ' – ' +
    new Date(Date.UTC(periodY, periodMo, 1)).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  const days = getLast90Days()
  const since = `${days[0].key}T00:00:00.000Z`
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // ── All static data in parallel ─────────────────────────────────────────────
  const [
    totalStorageStats,
    dbSizeBytes,
    { data: allUsers },
    { data: recentUsers },
    ticketStatsResult,
    doctorCountsResult,
    { data: recentTickets },
    egressLogsResult,
    doctorStorageRows,
  ] = await Promise.all([
    getTotalStorage().catch(() => ({ inputBytes: 0, dziBytes: 0, totalBytes: 0 })),
    supabaseAdmin.rpc('get_db_size_bytes').then(({ data }) => data as number | null, () => null),
    supabaseAdmin.from('profiles')
      .select('id, email, first_name, last_name, created_at, hospital_name, status, deletion_scheduled_at')
      .neq('role', 'admin')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('profiles')
      .select('created_at')
      .neq('role', 'admin')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    // DB-side aggregation — replaces full-table scan of tickets
    supabaseAdmin.rpc('get_admin_ticket_stats'),
    supabaseAdmin.rpc('get_doctor_analysis_counts'),
    supabaseAdmin.from('tickets')
      .select('created_at, status')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('egress_logs')
      .select('doctor_id, bytes')
      .gte('created_at', startOfMonth),
    getAllDoctorsStorage().catch(() => []),
  ])

  // ── Derived maps ────────────────────────────────────────────────────────────
  const storageByUser: Record<string, number> = {}
  for (const row of doctorStorageRows) storageByUser[row.doctorId] = row.totalBytes

  const egressByUser: Record<string, number> = {}
  for (const row of (egressLogsResult.data ?? []) as EgressLogRow[]) {
    if (row.doctor_id) egressByUser[row.doctor_id] = (egressByUser[row.doctor_id] ?? 0) + (row.bytes ?? 0)
  }

  // Per-doctor counts from DB aggregate
  const analysesByUser: Record<string, number> = {}
  for (const row of (doctorCountsResult.data ?? [])) {
    if (row.doctor_id) analysesByUser[row.doctor_id] = row.analysis_count
  }

  // Global ticket stats from DB aggregate
  const ticketStats = ticketStatsResult.data?.[0] ?? { total: 0, completed: 0, failed: 0 }
  const completed  = ticketStats.completed
  const failed     = ticketStats.failed
  const totalUsers = allUsers?.length ?? 0

  const dayMap: Record<string, number> = {}
  for (const u of recentUsers ?? []) dayMap[u.created_at.slice(0, 10)] = (dayMap[u.created_at.slice(0, 10)] ?? 0) + 1

  const analysisDayMap: Record<string, number> = {}
  for (const t of recentTickets ?? []) analysisDayMap[t.created_at.slice(0, 10)] = (analysisDayMap[t.created_at.slice(0, 10)] ?? 0) + 1

  let running = totalUsers - (recentUsers?.length ?? 0)
  const usersChartData    = days.map(d => { running += dayMap[d.key] ?? 0; return { label: d.label, value: running } })
  const analysesChartData = days.map(d => ({ label: d.label, value: analysisDayMap[d.key] ?? 0 }))

  const thisMonth = (recentUsers ?? []).filter(u => {
    const d = new Date(u.created_at), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // ── Period-dependent data ────────────────────────────────────────────────────
  // Use calendar month (not billing period) so emails sent before the billing day
  // are still counted (e.g. emails from May 9 when billing starts May 24).
  let emailsSent: number | null = null
  let egressBytes = 0

  if (isCurrentMonth) {
    // Email: ciclo Resend, reset il giorno RESEND_RESET_DAY (auto-detect periodo corrente)
    const { startMs: emailStartMs, endMs: emailEndMs } = getPeriodMs(RESEND_RESET_DAY)

    // Egress: ciclo Supabase, reset il giorno BILLING_DAY (auto-detect periodo corrente)
    const { startMs: egStartMs, endMs: egEndMs } = getBillingPeriodMs()
    const egStartIso = new Date(egStartMs).toISOString()
    const egEndIso   = new Date(egEndMs - 1).toISOString()

    const resendKey = process.env.RESEND_API_KEY
    const [emailCount, egressStats] = await Promise.all([
      resendKey ? countResendEmailsForPeriod(resendKey, emailStartMs, emailEndMs) : Promise.resolve(null),
      getTotalEgress({ from: egStartIso, to: egEndIso }),
    ])
    emailsSent  = emailCount
    egressBytes = egressStats.totalBytes
  }

  return (
    <div className="py-10 px-8">

      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
          {todayCapitalized}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panoramica Histyon</h1>
      </div>

      {/* Storage boxes */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        <AdminStatCard label="Database PostgreSQL" value={dbSizeBytes ?? 0} format="bytes" />
        <AdminStatCard label="Storage bucket"      value={totalStorageStats.totalBytes} format="bytes" />
      </div>

      {/* ── Users section ──────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-10 mb-12">

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-3">Utenti</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Totale utenti',         value: totalUsers.toLocaleString('it-IT') },
            { label: 'Nuovi questo mese',      value: thisMonth.toLocaleString('it-IT') },
            { label: 'Nuovi ultimi 90 giorni', value: (recentUsers?.length ?? 0).toLocaleString('it-IT') },
          ].map(({ label, value }) => (
            <div key={label} className="border border-gray-200 bg-white px-6 py-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">{label}</p>
              <p className="text-3xl font-bold tabular-nums text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-3">Analisi effettuate</p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Totale analisi',      value: ticketStats.total.toLocaleString('it-IT'), red: false },
            { label: 'Completate',          value: completed.toLocaleString('it-IT'),      red: false },
            { label: 'Fallite',             value: failed.toLocaleString('it-IT'),         red: failed > 0 },
          ].map(({ label, value, red }) => (
            <div key={label} className="border border-gray-200 bg-white px-6 py-5">
              <p className={`text-[10px] font-medium uppercase tracking-[0.14em] mb-2 ${red ? 'text-red-400' : 'text-gray-400'}`}>{label}</p>
              <p className={`text-3xl font-bold tabular-nums ${red ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Dati utenti</p>
        <div className="border border-gray-200 bg-white mb-8">
          <UsersTable
            users={((allUsers ?? []) as UserProfile[]).map(u => ({
              id:                    u.id,
              email:                 u.email,
              first_name:            u.first_name,
              last_name:             u.last_name,
              hospital_name:         u.hospital_name,
              created_at:            u.created_at,
              analyses:              analysesByUser[u.id] ?? 0,
              storageBytes:          storageByUser[u.id] ?? 0,
              egressBytes:           egressByUser[u.id] ?? 0,
              status:                u.status ?? 'pending',
              deletion_scheduled_at: u.deletion_scheduled_at,
            } satisfies UserRow))}
          />
        </div>

        <TrendSection
          usersChartData={usersChartData}
          analysesChartData={analysesChartData}
        />

      </div>

      {/* ── Monthly section ────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-10">

        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Riepilogo mensile</h2>
          <span className="text-xs text-gray-400">{periodLabel}</span>
        </div>

        <Suspense>
          <MonthPicker minMonth={PROJECT_START} />
        </Suspense>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="border border-gray-200 bg-white px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Email inviate</p>
            <p className="text-3xl font-bold tabular-nums text-gray-900">
              {emailsSent !== null ? fmtNum(emailsSent) : '—'}
            </p>
          </div>
          <div className="border border-gray-200 bg-white px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Egress Storage</p>
            <p className="text-3xl font-bold tabular-nums text-gray-900">
              {formatBytes(egressBytes)}
            </p>
          </div>
        </div>

      </div>

    </div>
  )
}
