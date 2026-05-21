import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ExternalLink, ChevronRight } from 'lucide-react'
import { MonthBadge } from '@/components/admin/MonthBadge'
import { getTotalStorage, getAllDoctorsStorage } from '@/lib/usage/storage'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Supabase' }

function formatBytes(b: number): string {
  const GiB = 1024 * 1024 * 1024
  const MiB = 1024 * 1024
  const KiB = 1024
  if (b >= GiB) return `${(b / GiB).toFixed(2)} GB`
  if (b >= MiB) return `${(b / MiB).toFixed(1)} MB`
  if (b >= KiB) return `${(b / KiB).toFixed(1)} KB`
  return `${b} B`
}

function extractSbMetric(usageJson: any, keys: string[]): number | null {
  if (!usageJson) return null
  // flat object
  for (const k of keys) {
    if (usageJson[k] != null) return Number(usageJson[k])
  }
  // array format: { usages: [{ metric: 'db_size', usage: 123, available_in_plan: true }] }
  const arr: any[] = usageJson.usages ?? usageJson.metrics ?? []
  for (const k of keys) {
    const found = arr.find((m: any) => m.metric === k)
    if (found != null) {
      if (found.available_in_plan === false) return -1  // -1 = unavailable in plan
      if (found.usage != null) return Number(found.usage)
    }
  }
  return null
}

async function fetchSupabaseData(monthStr: string) {
  const token = process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN!
  const projectId = process.env.ADMIN_SUPABASE_PROJECT_ID!
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const [orgRes, projectRes, usageRes] = await Promise.all([
    fetch(`https://api.supabase.com/v1/organizations`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.supabase.com/v1/projects/${projectId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.supabase.com/v1/projects/${projectId}/usage`, { headers, next: { revalidate: 300 } }).catch(() => null),
  ])

  const [orgs, project] = await Promise.all([orgRes.json(), projectRes.json()])
  const org = Array.isArray(orgs) ? orgs[0] : null
  const usageJson = usageRes?.ok ? await usageRes.json().catch(() => null) : null

  return { org, project, usageJson }
}

export default async function AdminSupabasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const monthStr = new Date().toISOString().slice(0, 7)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { org, project, usageJson },
    { count: totalUsers },
    { count: totalAnalyses },
    egressResult,
    totalStorageStats,
    doctorStorageRows,
    dbSizeFromRpc,
    authStatsRpc,
  ] = await Promise.all([
    fetchSupabaseData(monthStr),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }),
    Promise.resolve(
      supabaseAdmin.from('egress_logs')
        .select('bytes')
        .gte('created_at', startOfMonth)
    ).then(({ data }) => {
      return (data ?? []).reduce((s: number, r: any) => s + (r.bytes ?? 0), 0)
    }).catch(() => 0),
    getTotalStorage().catch(() => ({ inputBytes: 0, dziBytes: 0, totalBytes: 0 })),
    getAllDoctorsStorage().catch(() => []),
    // DB size direttamente da PostgreSQL — non richiede Management API token
    supabaseAdmin.rpc('get_db_size_bytes').then(({ data }) => data as number | null, () => null),
    // Auth stats (MAU, third-party MAU, connessioni DB) — diretti da auth schema
    supabaseAdmin.rpc('get_auth_stats').then(({ data }) => data as Record<string, number> | null, () => null),
  ])

  // DB size: query diretta a Postgres (nessun Management API token richiesto)
  const dbSizeBytes: number | null = dbSizeFromRpc ?? extractSbMetric(usageJson, ['db_size_bytes', 'db_size'])

  // Auth stats da RPC (auth schema, nessun Management API token richiesto)
  const mauFromRpc: number | null = authStatsRpc != null ? (authStatsRpc.mau as number) : null
  const thirdPartyMauFromRpc: number | null = authStatsRpc != null ? (authStatsRpc.third_party_mau as number) : null
  const dbConnectionsFromRpc: number | null = authStatsRpc != null ? (authStatsRpc.db_connections as number) : null

  const mauFromApi = extractSbMetric(usageJson, ['monthly_active_users', 'mau'])
  const realtimePeakConnections = extractSbMetric(usageJson, ['realtime_peak_connections'])
  const storageSizeFromApi = extractSbMetric(usageJson, ['storage_size_bytes', 'storage_size'])
  const egressFromApi = extractSbMetric(usageJson, ['egress_bytes', 'egress'])
  const cachedEgress = extractSbMetric(usageJson, ['storage_egress', 'cached_egress'])
  const thirdPartyMauFromApi = extractSbMetric(usageJson, ['monthly_active_third_party_users'])
  const realtimeMessages = extractSbMetric(usageJson, ['realtime_message_count'])
  const edgeInvocations = extractSbMetric(usageJson, ['edge_invocations', 'edge_function_invocations'])
  const ssoMau = extractSbMetric(usageJson, ['monthly_active_sso_users'])
  const imageTransformations = extractSbMetric(usageJson, ['storage_image_transformations'])

  // Storage reale dai bucket
  const storageBytesReal = totalStorageStats.totalBytes
  // Egress da egress_logs (se presente), fallback all'API
  const egressBytes = (egressResult as number) > 0 ? (egressResult as number) : (egressFromApi ?? null)
  // MAU: usa RPC diretta (più precisa: last_sign_in_at < 30gg), fallback API, fallback totale utenti
  const mauUsed = mauFromRpc ?? mauFromApi ?? totalUsers ?? 0
  // Third-party MAU: usa RPC diretta, fallback API
  const thirdPartyMau = thirdPartyMauFromRpc ?? thirdPartyMauFromApi
  // Connessioni DB correnti da pg_stat_activity (proxy per Realtime connections)
  const dbConnections = dbConnectionsFromRpc ?? realtimePeakConnections

  const plan = org?.plan ?? 'free'
  const isPro = plan === 'pro'
  const recurringCost = isPro ? 25 : 0

  // Limits
  const DB_SIZE_LIMIT_FREE = 500 * 1024 * 1024
  const DB_SIZE_LIMIT_PRO = 8 * 1024 * 1024 * 1024
  const MAU_LIMIT = 50_000
  const STORAGE_LIMIT_FREE = 1 * 1024 * 1024 * 1024
  const STORAGE_LIMIT_PRO = 100 * 1024 * 1024 * 1024
  const EGRESS_LIMIT_FREE = 5 * 1024 * 1024 * 1024
  const EGRESS_LIMIT_PRO = 250 * 1024 * 1024 * 1024
  const CACHED_EGRESS_LIMIT = 5 * 1024 * 1024 * 1024  // 5 GB (Free); Pro: illimitato
  const REALTIME_CONN_LIMIT = isPro ? 500 : 200
  const REALTIME_MSG_LIMIT = isPro ? 5_000_000 : 2_000_000
  const EDGE_LIMIT = isPro ? 2_000_000 : 500_000

  const dbSizeLimit = isPro ? DB_SIZE_LIMIT_PRO : DB_SIZE_LIMIT_FREE
  const storageLimit = isPro ? STORAGE_LIMIT_PRO : STORAGE_LIMIT_FREE
  const egressLimit = isPro ? EGRESS_LIMIT_PRO : EGRESS_LIMIT_FREE

  // Compute overage costs (only for Pro)
  let addonCost = 0
  if (isPro) {
    if (dbSizeBytes !== null && dbSizeBytes > 0 && dbSizeBytes > DB_SIZE_LIMIT_PRO) {
      addonCost += ((dbSizeBytes - DB_SIZE_LIMIT_PRO) / 1e9) * 0.125
    }
    if (storageBytesReal > STORAGE_LIMIT_PRO) {
      addonCost += ((storageBytesReal - STORAGE_LIMIT_PRO) / 1e9) * 0.021
    }
    if (egressBytes !== null && egressBytes > EGRESS_LIMIT_PRO) {
      addonCost += ((egressBytes - EGRESS_LIMIT_PRO) / 1e9) * 0.09
    }
    if (mauUsed > MAU_LIMIT) {
      addonCost += (mauUsed - MAU_LIMIT) * 0.00325
    }
  }

  const mgmtTokenMissing = !process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN

  function unavailabilityMsg(value: number | null, _proOnly = false): string | null {
    if (value === null) {
      if (mgmtTokenMissing) return 'Token API non configurato — aggiungi ADMIN_SUPABASE_MANAGEMENT_TOKEN in Vercel → Settings → Environment Variables (ottienilo su supabase.com/dashboard/account/tokens)'
      if (usageJson === null) return 'Errore chiamata API Supabase — token potrebbe essere scaduto o errato'
      return 'Metrica non inclusa nella risposta API (piano Free)'
    }
    if (value === -1) return 'Non disponibile nel piano Free — attiva da piano Pro'
    return null
  }

  // Formatta numeri grandi in modo leggibile: 2000000 → "2M", 500000 → "500K"
  function fmtNum(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000 % 1 === 0 ? v / 1_000_000 : (v / 1_000_000).toFixed(1))}M`
    if (v >= 1_000) return `${(v / 1_000 % 1 === 0 ? v / 1_000 : (v / 1_000).toFixed(1))}K`
    return v.toLocaleString('it-IT')
  }

  function pctBar(value: number, limit: number) {
    const pct = Math.min((value / limit) * 100, 200)
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
          <div
            className={`h-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
          {formatBytes(value)} / {formatBytes(limit)}
        </span>
      </div>
    )
  }

  function numBar(value: number, limit: number, unit?: string, fmt: (v: number) => string = fmtNum) {
    const pct = Math.min((value / limit) * 100, 200)
    const label = (v: number) => `${fmt(v)}${unit ? ` ${unit}` : ''}`
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
          <div
            className={`h-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
          {label(value)} / {label(limit)}
        </span>
      </div>
    )
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Supabase</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-5 h-5 bg-[#3ECF8E] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 109 113" fill="none" className="w-3 h-3">
                <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="white"/>
                <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="white" fillOpacity="0.7"/>
              </svg>
            </div>
            <p className="text-sm text-gray-400">{project?.name ?? 'histyon-db'}</p>
          </div>
        </div>
        <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          Apri dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Cost summary boxes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo ricorrente</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${recurringCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Piano {isPro ? 'Pro' : 'Free'} mensile</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo add-on</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${addonCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Utilizzo oltre soglie incluse nel piano</p>
        </div>
      </div>

      {/* Unified cost table */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Dettaglio costi</h2>
        <MonthBadge monthStr={monthStr} live />
      </div>
      <div className="border border-gray-200 bg-white mb-8">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Voce</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Utilizzo</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 text-right">Costo</p>
        </div>

        {/* 1. Piano Free / Pro */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Piano {isPro ? 'Pro' : 'Free'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400">Costo fisso mensile</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">${recurringCost.toFixed(2)}</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Piano Free: <strong>$0/mese</strong> — include 500 MB DB, 50k MAU, 1 GB storage, 5 GB egress</p>
            <p>Piano Pro: <strong>$25/mese</strong> — include 8 GB DB, 50k MAU, 100 GB storage, 250 GB egress</p>
          </div>
        </details>

        {/* 2. Database Size */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Database Size (PostgreSQL)</span>
            </div>
            <div className="flex items-center gap-2">
              {dbSizeBytes !== null && dbSizeBytes >= 0
                ? pctBar(dbSizeBytes, dbSizeLimit)
                : <span className={`text-xs ${usageJson === null ? 'text-amber-600' : 'text-gray-300'}`}>{unavailabilityMsg(dbSizeBytes)}</span>
              }
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia: <strong>500 MB</strong> (Free) · <strong>8 GB</strong> (Pro)</p>
            <p>Oltre soglia (Pro): <strong>$0.125/GB/mese</strong></p>
            {!isPro && dbSizeBytes !== null && dbSizeBytes > 0 && dbSizeBytes > DB_SIZE_LIMIT_FREE && (
              <p className="text-amber-600 font-medium">Limite raggiunto — Supabase può mettere il progetto in pausa. Nessun costo extra: aggiorna a Pro per evitarlo.</p>
            )}
          </div>
        </details>

        {/* 3. Realtime Peak Connections */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Realtime Concurrent Peak Connections</span>
            </div>
            <div className="flex items-center gap-2">
              {dbConnections !== null && dbConnections >= 0
                ? numBar(dbConnections, REALTIME_CONN_LIMIT, 'conn.')
                : <span className={`text-xs ${usageJson === null ? 'text-amber-600' : 'text-gray-300'}`}>{unavailabilityMsg(realtimePeakConnections)}</span>
              }
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia: <strong>200 connessioni simultanee</strong> (Free) · <strong>500</strong> (Pro)</p>
            {dbConnectionsFromRpc !== null && (
              <p className="text-gray-400">Dato da <code>pg_stat_activity</code>: connessioni PostgreSQL attive (la metrica Supabase traccia le connessioni WebSocket Realtime, richiede API token per il valore esatto).</p>
            )}
          </div>
        </details>

        {/* 4. Storage Size */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Storage Size (bucket Supabase)</span>
            </div>
            <div className="flex items-center gap-2">
              {pctBar(storageBytesReal, storageLimit)}
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${isPro && storageBytesReal > STORAGE_LIMIT_PRO ? 'text-red-600' : 'text-gray-400'}`}>
                {isPro && storageBytesReal > STORAGE_LIMIT_PRO
                  ? `$${(((storageBytesReal - STORAGE_LIMIT_PRO) / 1e9) * 0.021).toFixed(2)}`
                  : '$0.00'
                }
              </span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>File di input e analisi DZI archiviati nei bucket Supabase Storage.</p>
            <p>Soglia: <strong>1 GB</strong> (Free) · <strong>100 GB</strong> (Pro)</p>
            <p>Oltre soglia (Pro): <strong>$0.021/GB</strong></p>
            <p className="text-gray-400">Storage input: <strong>{formatBytes(totalStorageStats.inputBytes)}</strong> · Storage DZI: <strong>{formatBytes(totalStorageStats.dziBytes)}</strong></p>
            <p className="text-gray-400 italic">Supabase fattura in base alla media giornaliera dello storage nel mese (GB×giorni/giorni_nel_mese). Lo storage attuale è: {formatBytes(storageBytesReal)} su {daysInMonth} giorni nel mese.</p>
            {storageSizeFromApi !== null && storageSizeFromApi >= 0 && (
              <p>Valore API Supabase: <strong>{formatBytes(storageSizeFromApi)}</strong></p>
            )}
          </div>
        </details>

        {/* 5. Storage Egress */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Storage Egress</span>
            </div>
            <div className="flex items-center gap-2">
              {pctBar(egressBytes ?? 0, egressLimit)}
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${isPro && egressBytes !== null && egressBytes > EGRESS_LIMIT_PRO ? 'text-red-600' : 'text-gray-400'}`}>
                {isPro && egressBytes !== null && egressBytes > EGRESS_LIMIT_PRO
                  ? `$${(((egressBytes - EGRESS_LIMIT_PRO) / 1e9) * 0.09).toFixed(2)}`
                  : '$0.00'
                }
              </span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia: <strong>5 GB/mese</strong> (Free) · <strong>250 GB/mese</strong> (Pro)</p>
            <p>Oltre soglia (Pro): <strong>$0.09/GB</strong></p>
            <p>Calcolato dalla tabella <code>egress_logs</code> per il mese corrente.</p>
          </div>
        </details>

        {/* 6. MAU */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Monthly Active Users (MAU)</span>
            </div>
            <div className="flex items-center gap-2">
              {numBar(mauUsed, MAU_LIMIT, 'utenti')}
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${isPro && mauUsed > MAU_LIMIT ? 'text-red-600' : 'text-gray-400'}`}>
                {isPro && mauUsed > MAU_LIMIT
                  ? `$${((mauUsed - MAU_LIMIT) * 0.00325).toFixed(2)}`
                  : '$0.00'
                }
              </span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia: <strong>50.000 MAU/mese</strong> (Free e Pro incluso)</p>
            <p>Oltre soglia (Pro): <strong>$0.00325/MAU</strong></p>
            {mauFromRpc !== null && (
              <p className="text-gray-400">Dato da <code>auth.users</code>: utenti con <code>last_sign_in_at</code> negli ultimi 30 giorni — stessa definizione usata da Supabase.</p>
            )}
            {mauFromApi !== null && mauFromApi >= 0 && (
              <p>Valore API Supabase: <strong>{mauFromApi.toLocaleString('it-IT')}</strong></p>
            )}
          </div>
        </details>

        {/* 7. Cached Egress */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Cached Egress</span>
            </div>
            <div className="flex items-center gap-2">
              {isPro
                ? <span className="text-[10px] font-mono text-gray-500">{formatBytes(cachedEgress ?? 0)} / illimitato</span>
                : pctBar(cachedEgress ?? 0, CACHED_EGRESS_LIMIT)
              }
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia: <strong>5 GB</strong> (Free) · <strong>illimitato</strong> (Pro)</p>
            {cachedEgress === null && <p className="text-gray-300">Dato disponibile con ADMIN_SUPABASE_MANAGEMENT_TOKEN — mostrato 0 come stima conservativa.</p>}
          </div>
        </details>

        {/* 8. Monthly Active Third-Party Users */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Monthly Active Third-Party Users</span>
            </div>
            <div className="flex items-center gap-2">
              {thirdPartyMau !== null && thirdPartyMau >= 0
                ? numBar(thirdPartyMau, 50_000, 'utenti')
                : <span className={`text-xs ${usageJson === null ? 'text-amber-600' : 'text-gray-300'}`}>{unavailabilityMsg(thirdPartyMau)}</span>
              }
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia: <strong>50.000</strong> (Free e Pro)</p>
            {thirdPartyMauFromRpc !== null && (
              <p className="text-gray-400">Dato da <code>auth.users</code>: utenti OAuth (Google, GitHub, ecc.) con accesso negli ultimi 30 giorni.</p>
            )}
          </div>
        </details>

        {/* 9. Realtime Messages */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Realtime Messages</span>
            </div>
            <div className="flex items-center gap-2">
              {numBar(realtimeMessages ?? 0, REALTIME_MSG_LIMIT, 'msg')}
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia: <strong>2M messaggi/mese</strong> (Free) · <strong>5M</strong> (Pro)</p>
            <p>Oltre soglia (Pro): <strong>$2.50/M messaggi</strong></p>
            {realtimeMessages === null && <p className="text-gray-300">Realtime non utilizzato da questa applicazione — mostrato 0. Dato esatto disponibile con ADMIN_SUPABASE_MANAGEMENT_TOKEN.</p>}
          </div>
        </details>

        {/* 10. Edge Function Invocations */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Edge Function Invocations</span>
            </div>
            <div className="flex items-center gap-2">
              {numBar(edgeInvocations ?? 0, EDGE_LIMIT, 'inv.')}
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia: <strong>500k/mese</strong> (Free) · <strong>2M</strong> (Pro)</p>
            <p>Oltre soglia (Pro): <strong>$2/M invocazioni</strong></p>
            {edgeInvocations === null && <p className="text-gray-300">Edge Functions non utilizzate da questa applicazione — mostrato 0. Dato esatto disponibile con ADMIN_SUPABASE_MANAGEMENT_TOKEN.</p>}
          </div>
        </details>

        {/* 11. Monthly Active SSO Users */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Monthly Active SSO Users</span>
            </div>
            <div className="flex items-center gap-2">
              {ssoMau !== null && ssoMau >= 0
                ? numBar(ssoMau, 50_000, 'utenti')
                : ssoMau === -1 || (!isPro && ssoMau === null)
                  ? <span className="text-xs text-gray-300">Non disponibile nel piano Free — funzionalità disponibile da piano Pro</span>
                  : <span className={`text-xs ${usageJson === null ? 'text-amber-600' : 'text-gray-300'}`}>{unavailabilityMsg(ssoMau)}</span>
              }
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>SSO disponibile dal piano Pro. Soglia: <strong>50k MAU SSO</strong></p>
          </div>
        </details>

        {/* 12. Storage Image Transformations */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Storage Image Transformations</span>
            </div>
            <div className="flex items-center gap-2">
              {imageTransformations !== null && imageTransformations >= 0
                ? numBar(imageTransformations, 100, 'trasf.')
                : imageTransformations === -1 || (!isPro && imageTransformations === null)
                  ? <span className="text-xs text-gray-300">Non disponibile nel piano Free — attiva da piano Pro</span>
                  : <span className={`text-xs ${usageJson === null ? 'text-amber-600' : 'text-gray-300'}`}>{unavailabilityMsg(imageTransformations)}</span>
              }
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 text-xs text-gray-500 space-y-1">
            <p>Image Transformation disponibile dal piano Pro.</p>
          </div>
        </details>
      </div>

      {/* App data */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Utilizzo corrente</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Spazio DB PostgreSQL</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900">
            {dbSizeBytes !== null ? formatBytes(dbSizeBytes) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">/ {formatBytes(dbSizeLimit)}</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Spazio Storage bucket</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900">
            {formatBytes(storageBytesReal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">/ {formatBytes(storageLimit)}</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Egress questo mese</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900">
            {formatBytes(egressBytes ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">/ {formatBytes(egressLimit)}</p>
        </div>
      </div>
    </div>
  )
}
