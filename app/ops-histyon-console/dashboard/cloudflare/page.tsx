import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ArrowLeft, ExternalLink, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cloudflare — Console Histyon' }

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

async function fetchCloudflareData(monthStr: string) {
  const token = process.env.ADMIN_CLOUDFLARE_TOKEN!
  const accountId = process.env.ADMIN_CLOUDFLARE_ACCOUNT_ID!
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const [year, month] = monthStr.split('-').map(Number)
  const monthStart = `${monthStr}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${monthStr}-${String(lastDay).padStart(2, '0')}`

  const [accountRes, subsRes, zonesRes, billingHistRes] = await Promise.all([
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/subscriptions`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/zones?account.id=${accountId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/billing/history?page=1&per_page=50`, { headers, next: { revalidate: 300 } }),
  ])

  // Cloudflare R2 analytics via GraphQL
  // r2StorageAdaptiveGroups: storage per bucket (max fields only, no sum)
  // r2OperationsAdaptiveGroups: operations per bucket (sum fields)
  const graphqlQuery = `{
  viewer {
    accounts(filter: {accountTag: "${accountId}"}) {
      storage: r2StorageAdaptiveGroups(
        limit: 100,
        orderBy: [date_DESC],
        filter: {date_geq: "${monthStart}", date_leq: "${monthEnd}"}
      ) {
        dimensions { bucketName }
        max { payloadSize metadataSize objectCount }
      }
      ops: r2OperationsAdaptiveGroups(
        limit: 100,
        orderBy: [date_DESC],
        filter: {date_geq: "${monthStart}", date_leq: "${monthEnd}"}
      ) {
        dimensions { bucketName actionType }
        sum { requests }
      }
    }
  }
}`

  const graphqlRes = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: graphqlQuery }),
    next: { revalidate: 300 }
  }).catch(() => null)

  const [account, subs, zones, billingHist] = await Promise.all([
    accountRes.json(), subsRes.json(), zonesRes.json(), billingHistRes.json()
  ])
  const graphql = graphqlRes ? await graphqlRes.json().catch(() => null) : null

  const storageGroups: any[] = graphql?.data?.viewer?.accounts?.[0]?.storage ?? []
  const opsGroups: any[] = graphql?.data?.viewer?.accounts?.[0]?.ops ?? []

  // Aggregate storage across all buckets
  const r2StorageBytes: number = storageGroups.reduce((s, g) => s + (g.max?.payloadSize ?? 0), 0)

  // Classify operations: actionType starting with 'PutObject','CreateMultipartUpload','UploadPart' = Class A; 'GetObject','HeadObject','ListObjects' = Class B
  const CLASS_A_ACTIONS = ['PutObject', 'CreateMultipartUpload', 'UploadPart', 'CompleteMultipartUpload']
  const r2ClassA: number = opsGroups
    .filter(g => CLASS_A_ACTIONS.some(a => (g.dimensions?.actionType ?? '').startsWith(a)))
    .reduce((s, g) => s + (g.sum?.requests ?? 0), 0)
  const r2ClassB: number = opsGroups
    .filter(g => !CLASS_A_ACTIONS.some(a => (g.dimensions?.actionType ?? '').startsWith(a)))
    .reduce((s, g) => s + (g.sum?.requests ?? 0), 0)

  const monthBilling = (billingHist?.result ?? []).filter((b: any) => {
    return b.occurred_at?.startsWith(monthStr)
  })

  return {
    account: account?.result ?? null,
    subscriptions: subs?.result ?? [],
    zones: zones?.result ?? [],
    billingHistory: billingHist?.result ?? [],
    monthBilling,
    r2StorageBytes,
    r2ClassA,
    r2ClassB,
  }
}

export default async function AdminCloudflarePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const sp = await searchParams
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthStr = sp.month ?? currentMonth
  const isCurrentMonth = monthStr === currentMonth

  const { account, subscriptions, zones, billingHistory, monthBilling, r2StorageBytes, r2ClassA, r2ClassB } = await fetchCloudflareData(monthStr)

  const [{ count: totalFiles }] = await Promise.all([
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }),
  ])
  const totalStorageBytes = 0 // file_size removed from tickets table

  const R2_FREE_STORAGE = 10 * 1024 * 1024 * 1024
  const R2_FREE_CLASS_A = 1_000_000
  const R2_FREE_CLASS_B = 10_000_000
  const R2_PRICE_STORAGE = 0.015 / (1024 * 1024 * 1024)
  const R2_PRICE_CLASS_A = 4.50 / 1_000_000
  const R2_PRICE_CLASS_B = 0.36 / 1_000_000

  let addonCost = 0
  let recurringCost = 0

  if (isCurrentMonth) {
    const storageOverage = Math.max(0, r2StorageBytes - R2_FREE_STORAGE)
    const classAOverage = Math.max(0, r2ClassA - R2_FREE_CLASS_A)
    const classBOverage = Math.max(0, r2ClassB - R2_FREE_CLASS_B)
    addonCost = storageOverage * R2_PRICE_STORAGE + classAOverage * R2_PRICE_CLASS_A + classBOverage * R2_PRICE_CLASS_B
    recurringCost = subscriptions.reduce((s: number, sub: any) => s + (sub.price ?? 0), 0)
  } else {
    addonCost = monthBilling.reduce((s: number, b: any) => s + (b.amount ?? 0), 0)
  }

  const r2StoragePct = Math.min((r2StorageBytes / R2_FREE_STORAGE) * 100, 200)
  const r2ClassAPct = Math.min((r2ClassA / R2_FREE_CLASS_A) * 100, 200)
  const r2ClassBPct = Math.min((r2ClassB / R2_FREE_CLASS_B) * 100, 200)

  const storageOverageCost = Math.max(0, r2StorageBytes - R2_FREE_STORAGE) * R2_PRICE_STORAGE
  const classAOverageCost = Math.max(0, r2ClassA - R2_FREE_CLASS_A) * R2_PRICE_CLASS_A
  const classBOverageCost = Math.max(0, r2ClassB - R2_FREE_CLASS_B) * R2_PRICE_CLASS_B

  const monthLabel = new Date(monthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <div className="py-10 px-8">
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F48120] flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">CF</span>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em]">Cloudflare</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{account?.name ?? 'Account'}</h1>
          </div>
        </div>
        <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          Apri dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Month picker */}
      <Suspense>
        <MonthPicker />
      </Suspense>

      {/* Cost summary boxes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo ricorrente</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${recurringCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">{(account?.type ?? 'standard').charAt(0).toUpperCase() + (account?.type ?? 'standard').slice(1)} — nessun piano fisso</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo add-on</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${addonCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Utilizzo R2 oltre soglie incluse</p>
        </div>
      </div>

      {/* Unified cost table */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Dettaglio costi — {monthLabel}
        {!isCurrentMonth && <span className="ml-2 text-gray-300 font-normal normal-case">(storico)</span>}
      </h2>
      <div className="border border-gray-200 bg-white mb-8">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Voce</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Utilizzo</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 text-right">Costo</p>
        </div>

        {/* Account / no recurring fee */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Account</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400">Nessun piano fisso</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
            Cloudflare non ha un costo fisso mensile per R2. Si paga solo per l&apos;utilizzo oltre le soglie gratuite.
          </div>
        </details>

        {/* R2 Storage */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">R2 Storage</span>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentMonth ? (
                <>
                  <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                    <div
                      className={`h-full transition-all ${r2StoragePct >= 100 ? 'bg-red-500' : r2StoragePct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
                      style={{ width: `${Math.min(r2StoragePct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                    {formatBytes(r2StorageBytes)} / 10 GB
                  </span>
                </>
              ) : <span className="text-xs text-gray-300">Dato non disponibile</span>}
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${storageOverageCost > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {storageOverageCost > 0 ? `+$${storageOverageCost.toFixed(4)}` : '$0.00'}
              </span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia gratuita: <strong>10 GB/mese</strong></p>
            <p>Oltre soglia: <strong>$0.015/GB/mese</strong></p>
          </div>
        </details>

        {/* R2 Class A operations */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">R2 Operazioni scrittura (A)</span>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentMonth ? (
                <>
                  <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                    <div
                      className={`h-full transition-all ${r2ClassAPct >= 100 ? 'bg-red-500' : 'bg-gray-800'}`}
                      style={{ width: `${Math.min(r2ClassAPct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                    {r2ClassA.toLocaleString('it-IT')} / 1M
                  </span>
                </>
              ) : <span className="text-xs text-gray-300">Dato non disponibile</span>}
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${classAOverageCost > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {classAOverageCost > 0 ? `+$${classAOverageCost.toFixed(4)}` : '$0.00'}
              </span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia gratuita: <strong>1.000.000 operazioni/mese</strong> (upload, creazione bucket)</p>
            <p>Oltre soglia: <strong>$4.50/milione</strong></p>
          </div>
        </details>

        {/* R2 Class B operations */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">R2 Operazioni lettura (B)</span>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentMonth ? (
                <>
                  <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                    <div
                      className={`h-full transition-all ${r2ClassBPct >= 100 ? 'bg-red-500' : 'bg-gray-800'}`}
                      style={{ width: `${Math.min(r2ClassBPct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                    {r2ClassB.toLocaleString('it-IT')} / 10M
                  </span>
                </>
              ) : <span className="text-xs text-gray-300">Dato non disponibile</span>}
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${classBOverageCost > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {classBOverageCost > 0 ? `+$${classBOverageCost.toFixed(4)}` : '$0.00'}
              </span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 text-xs text-gray-500 space-y-1">
            <p>Soglia gratuita: <strong>10.000.000 operazioni/mese</strong> (download, listing)</p>
            <p>Oltre soglia: <strong>$0.36/milione</strong></p>
            <p>Egress verso internet: <strong>gratuito</strong></p>
          </div>
        </details>
      </div>

      {/* App data */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Dati R2</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'File analisi archiviati', value: (totalFiles ?? 0).toLocaleString('it-IT') },
          { label: 'Spazio totale usato (R2)', value: formatBytes(totalStorageBytes) },
          { label: 'Zone DNS attive', value: zones.length.toLocaleString('it-IT') },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 bg-white px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">{label}</p>
            <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Zones */}
      {zones.length > 0 && (
        <>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Zone ({zones.length})</h2>
          <div className="border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Dominio', 'Piano', 'Stato', 'Zone ID'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((z: any) => (
                  <tr key={z.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{z.name}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{z.plan?.name ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium ${z.status === 'active' ? 'text-green-600' : 'text-amber-500'}`}>● {z.status}</span>
                    </td>
                    <td className="px-6 py-3 text-xs font-mono text-gray-400">{z.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
