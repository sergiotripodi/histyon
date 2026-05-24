import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExternalLink, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { MonthBadge } from '@/components/admin/MonthBadge'
import { getBillingPeriodMs } from '@/lib/billing/config'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Vercel' }

async function fetchVercelData(monthStr: string) {
  const token = process.env.ADMIN_VERCEL_TOKEN!
  const teamId = process.env.ADMIN_VERCEL_TEAM_ID!
  const projectId = process.env.ADMIN_VERCEL_PROJECT_ID!
  const headers = { Authorization: `Bearer ${token}` }

  // Uso il periodo di fatturazione reale (giorno 24 → giorno 23) invece del mese solare
  const { startMs: monthStartMs, endMs: monthEndMs } = getBillingPeriodMs(monthStr)

  const [teamRes, projectRes, deploymentsRes, domainsRes, membersRes, usageRes] = await Promise.all([
    fetch(`https://api.vercel.com/v1/teams/${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=50`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v5/domains?teamId=${teamId}`, { headers, next: { revalidate: 30 } }),
    fetch(`https://api.vercel.com/v2/teams/${teamId}/members`, { headers, next: { revalidate: 300 } }).catch(() => null),
    fetch(`https://api.vercel.com/v2/teams/${teamId}/usage?from=${monthStartMs}&to=${monthEndMs}`, { headers, next: { revalidate: 300 } }).catch(() => null),
  ])

  const [team, project, deployments, domains] = await Promise.all([
    teamRes.json(), projectRes.json(), deploymentsRes.json(), domainsRes.json(),
  ])
  const members    = membersRes?.ok ? await membersRes.json().catch(() => null) : null
  const usage      = usageRes?.ok ? await usageRes.json().catch(() => null) : null
  const usageStatus = usageRes?.status ?? 0

  return { team, project, deployments, domains, members, usage, usageStatus }
}

function deployStateIcon(state: string) {
  if (state === 'READY') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
  if (state === 'ERROR' || state === 'CANCELED') return <XCircle className="w-3.5 h-3.5 text-red-500" />
  return <Clock className="w-3.5 h-3.5 text-amber-500" />
}

function bytes(v: number): string {
  if (v >= 1024**3) return `${(v / 1024**3).toFixed(2)} GB`
  if (v >= 1024**2) return `${(v / 1024**2).toFixed(1)} MB`
  if (v >= 1024)    return `${(v / 1024).toFixed(1)} KB`
  return `${v} B`
}
function nFmt(v: number): string { return v.toLocaleString('it-IT') }
function minFmt(v: number): string { return `${v.toLocaleString('it-IT')} min` }

export default async function AdminVercelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const monthStr = new Date().toISOString().slice(0, 7)

  const { team, project, deployments, domains, members, usage, usageStatus } = await fetchVercelData(monthStr)

  const billing = team?.billing ?? {}
  const plan = billing.plan ?? 'hobby'
  const isPro = plan !== 'hobby' && plan !== 'free'

  // Billing cycle from Vercel API (when Pro was activated)
  const billingPeriodStart: number | null = billing.period?.start ?? billing.cycleStartDate ?? null
  const billingPeriodEnd: number | null   = billing.period?.end   ?? billing.cycleEndDate   ?? null
  const billingDayOfMonth: number | null  = billingPeriodStart
    ? new Date(billingPeriodStart).getDate()
    : null

  // Observability Plus add-on ($10/seat/month on Pro)
  const addons: any[] = billing.addons ?? []
  const hasObservabilityPlus = addons.some((a: any) => {
    const id = typeof a === 'string' ? a : (a?.id ?? a?.type ?? a?.name ?? '')
    return String(id).toLowerCase().includes('observab')
  })

  const allDomains: any[] = domains?.domains ?? []
  const allDeployments: any[] = deployments?.deployments ?? []
  const lastDeploy = allDeployments[0]

  const [y, m] = monthStr.split('-').map(Number)

  function domainRenewalCostThisMonth(d: any): number {
    // boughtAt / renewedAt sono Unix timestamp in ms
    const eventTs: number | null = d.renewedAt ?? d.boughtAt ?? null
    if (!eventTs) return 0
    const monthStart = Date.UTC(y, m - 1, 1)
    const monthEnd   = Date.UTC(y, m, 1)
    if (eventTs >= monthStart && eventTs < monthEnd) return d.price ?? 0
    return 0
  }

  function domainRegistrar(d: any): string {
    if (d.serviceType === 'zeit') return 'Vercel'
    const ns = (d.nameservers ?? []).join(' ').toLowerCase()
    if (ns.includes('vercel-dns')) return 'Vercel'
    if (ns.includes('cloudflare')) return 'Cloudflare'
    const match = d.nameservers?.[0]?.match(/([^.]+\.[^.]+)$/)
    if (match) return match[1]
    return 'Esterno'
  }

  function domainNextRenewal(d: any): string | null {
    if (!d.expiresAt) return null
    return new Date(d.expiresAt).toLocaleDateString('it-IT')
  }

  const domainAddonCost = allDomains.reduce((s, d) => s + domainRenewalCostThisMonth(d), 0)

  const memberCount: number = Array.isArray(members?.members) ? members.members.length : 0
  const billableMembers = Math.max(1, memberCount)
  // Observability è incluso nel piano Pro — nessun costo fisso aggiuntivo
  // Eventuale overage: $1.20/1M eventi (tracciato nell'usage se l'API lo espone)
  const recurringCost = isPro ? 20 * billableMembers : 0

  // Extract usage value — supports flat number or { value, limit } wrapper
  function extractUsageValue(field: string): number | null {
    if (!usage || typeof usage !== 'object') return null
    const raw = (usage as any)[field]
    if (raw == null) return null
    if (typeof raw === 'number') return raw
    if (typeof raw === 'object' && typeof raw.value === 'number') return raw.value
    return null
  }

  // Extract limit from usage response — API-first, no hardcoding
  function extractUsageLimit(field: string): number | null {
    if (!usage || typeof usage !== 'object') return null
    const raw = (usage as any)[field]
    if (raw && typeof raw === 'object' && raw.limit != null) return Number(raw.limit)
    // Some APIs return {field}Limit as a sibling key
    const limitKey = field + 'Limit'
    const rawLimit = (usage as any)[limitKey]
    if (rawLimit != null) return Number(rawLimit)
    return null
  }

  // All required metrics — always shown
  type MetricDef = {
    key: string
    label: string
    includedHobby: number
    includedPro: number
    format: (v: number) => string
    overagePerUnit: number
    hint: string
    proOnly?: boolean
  }

  const ALL_METRICS: MetricDef[] = [
    {
      key: 'bandwidth',
      label: 'Fast Data Transfer',
      includedHobby: 100 * 1024**3,
      includedPro: 1024 * 1024**3,
      format: bytes,
      overagePerUnit: 0.15 / 1024**3,
      hint: 'Banda dati servita dalla CDN — Hobby: 100 GB · Pro: 1 TB · oltre: $0.15/GB',
    },
    {
      key: 'fastOriginTransfer',
      label: 'Fast Origin Transfer',
      includedHobby: 10 * 1024**3,
      includedPro: 100 * 1024**3,
      format: bytes,
      overagePerUnit: 0.15 / 1024**3,
      hint: 'Trasferimento dati verso origine — Hobby: 10 GB · Pro: 100 GB · oltre: $0.15/GB',
    },
    {
      key: 'edgeRequest',
      label: 'Edge Requests',
      includedHobby: 1_000_000,
      includedPro: 10_000_000,
      format: nFmt,
      overagePerUnit: 2.00 / 1_000_000,
      hint: 'Richieste edge — Hobby: 1M · Pro: 10M · oltre: $2/M',
    },
    {
      key: 'edgeCpuTime',
      label: 'Edge Request CPU Duration',
      includedHobby: 0,
      includedPro: 0,
      format: (v) => `${v.toLocaleString('it-IT')} ms`,
      overagePerUnit: 0.65 / 1_000_000,
      hint: 'Durata CPU richieste edge — Pro: $0.65/M ms',
      proOnly: true,
    },
    {
      key: 'functionInvocation',
      label: 'Serverless Function Invocations',
      includedHobby: 100_000,
      includedPro: 1_000_000,
      format: nFmt,
      overagePerUnit: 0.60 / 1_000_000,
      hint: 'Esecuzioni funzioni serverless — Hobby: 100k · Pro: 1M · oltre: $0.60/M',
    },
    {
      key: 'buildMinute',
      label: 'Build Execution',
      includedHobby: 100,
      includedPro: 6000,
      format: minFmt,
      overagePerUnit: 0.70 / 100,
      hint: 'Minuti di build — Hobby: 100 min · Pro: 6.000 min · oltre: $0.70/100 min',
    },
    {
      key: 'imageOptimization',
      label: 'Image Optimization',
      includedHobby: 1_000,
      includedPro: 5_000,
      format: nFmt,
      overagePerUnit: 5.00 / 1_000,
      hint: 'Ottimizzazione immagini — Hobby: 1k · Pro: 5k · oltre: $5/1k',
    },
    {
      key: 'edgeMiddlewareInvocations',
      label: 'Edge Middleware',
      includedHobby: 1_000_000,
      includedPro: Infinity,
      format: nFmt,
      overagePerUnit: 0.65 / 1_000_000,
      hint: 'Esecuzioni Edge Middleware — Hobby: 1M · Pro: illimitato',
    },
  ]

  type MetricRow = MetricDef & {
    value: number | null
    unavailableReason: string | null
    overage: number
    cost: number
    included: number
    pct: number
  }

  const metricRows: MetricRow[] = ALL_METRICS.map(m => {
    // Fonte primaria: limite restituito dall'API usage di Vercel
    // Fallback: valori noti per piano (hardcoded solo qui come ultima risorsa)
    const apiLimit = extractUsageLimit(m.key)
    const included = apiLimit ?? (isPro ? m.includedPro : m.includedHobby)
    const value = extractUsageValue(m.key)

    let unavailableReason: string | null = null
    if (value === null) {
      if (usage === null) {
        if (!process.env.ADMIN_VERCEL_TEAM_ID) {
          unavailableReason = 'ADMIN_VERCEL_TEAM_ID non configurata nelle env vars'
        } else if (!process.env.ADMIN_VERCEL_TOKEN) {
          unavailableReason = 'ADMIN_VERCEL_TOKEN non configurata nelle env vars'
        } else if (usageStatus === 401 || usageStatus === 403) {
          unavailableReason = 'Token non autorizzato (401/403) — rigenera il token Vercel con scope "Full Account"'
        } else if (usageStatus === 404) {
          unavailableReason = 'Team non trovato (404) — ADMIN_VERCEL_TEAM_ID deve essere il team ID (team_xxx), non lo slug'
        } else if (usageStatus === 402) {
          unavailableReason = 'Piano insufficiente — usage API disponibile solo su Pro'
        } else {
          unavailableReason = `Errore API usage (HTTP ${usageStatus || '?'}) — verifica token e ADMIN_VERCEL_TEAM_ID`
        }
      } else if (!isPro && m.proOnly) {
        unavailableReason = 'Non disponibile sul piano Hobby — upgrade a Pro'
      } else if (isPro) {
        unavailableReason = 'Dato non restituito dall\'API'
      } else {
        unavailableReason = 'Non disponibile sul piano Hobby — upgrade a Pro'
      }
    }

    const v = value ?? 0
    const overage = included === Infinity ? 0 : Math.max(0, v - included)
    const cost = overage * m.overagePerUnit
    const pct = included > 0 && included !== Infinity ? Math.min((v / included) * 100, 200) : 0

    return { ...m, value, unavailableReason, overage, cost, included, pct }
  })

  const usageAddonCost = metricRows.reduce((s, r) => s + r.cost, 0)
  const addonCost = domainAddonCost + usageAddonCost


  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vercel</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-5 h-5 bg-gray-900 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 116 100" fill="white" className="w-3 h-3">
                <path d="M57.5 0L115 100H0L57.5 0z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-400">{project?.name ?? team?.name ?? 'histyon'}</p>
          </div>
        </div>
        <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          Apri dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Cost summary boxes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo ricorrente</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${recurringCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">
            Piano {isPro ? 'Pro' : 'Hobby'}
            {hasObservabilityPlus ? ' · Observability incluso' : ''}
          </p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo add-on</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${Math.max(0, addonCost - 20).toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">
            {addonCost > 0
              ? `$${addonCost.toFixed(2)} lordo — $20.00 credito Pro = $${Math.max(0, addonCost - 20).toFixed(2)} netto`
              : 'Nessun utilizzo oltre le soglie incluse nel piano'
            }
          </p>
        </div>
      </div>

      {/* Unified cost table */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Dettaglio costi</h2>
        <MonthBadge monthStr={monthStr} live />
      </div>
      <div className="border border-gray-200 bg-white mb-8">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Voce</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Utilizzo</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 text-right">Costo</p>
        </div>

        {/* Piano Hobby / Pro */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Piano {isPro ? 'Pro' : 'Hobby'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400">Costo fisso mensile</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">${recurringCost.toFixed(2)}</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Piano Hobby: <strong>$0/mese</strong> — uso personale e non commerciale</p>
            <p>Piano Pro: <strong>$20/mese per membro</strong> — include analytics, team features, SLA</p>
            {hasObservabilityPlus && <p>Observability: <strong>incluso nel Pro</strong> · overage $1.20/1M eventi</p>}
            {isPro && memberCount > 0 && (
              <p className="text-gray-700">Membri: <strong>{memberCount}</strong> × $20 = <strong>${recurringCost.toFixed(2)}/mese</strong></p>
            )}
            {billingPeriodStart && (
              <p className="text-gray-400 border-t border-gray-100 pt-1 mt-1">Ciclo attivo: dal {new Date(billingPeriodStart).toLocaleDateString('it-IT')} al {billingPeriodEnd ? new Date(billingPeriodEnd).toLocaleDateString('it-IT') : '—'}</p>
            )}
          </div>
        </details>

        {/* Metric rows — always shown */}
        {metricRows.map((r, idx) => {
          const isLast = idx === metricRows.length - 1 && allDomains.length === 0
          return (
            <details key={r.key} className="group">
              <summary className={`grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 ${!isLast ? 'border-b border-gray-50' : ''} hover:bg-gray-50 cursor-pointer list-none transition-colors`}>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
                  <span className="text-sm text-gray-800">{r.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.value !== null ? (
                    r.included > 0 && r.included !== Infinity ? (
                      <>
                        <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                          <div
                            className={`h-full transition-all ${r.pct >= 100 ? 'bg-red-500' : r.pct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
                            style={{ width: `${Math.min(r.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                          {r.format(r.value)} / {r.format(r.included)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-500">{r.format(r.value)}</span>
                    )
                  ) : (
                    <span className={`text-xs ${usage === null ? 'text-amber-600' : 'text-gray-300'}`}>
                      {r.unavailableReason}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${r.cost > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {r.value !== null ? (r.cost > 0 ? `$${r.cost.toFixed(2)}` : '$0.00') : '—'}
                  </span>
                </div>
              </summary>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
                <p>{r.hint}</p>
                {r.value !== null && r.overage > 0 && (
                  <p className="text-red-600">Overage: {r.format(r.overage)} oltre la soglia inclusa.</p>
                )}
              </div>
            </details>
          )
        })}

        {/* Domini */}
        {allDomains.length === 0 ? (
          <div className="px-6 py-4 text-xs text-gray-300">Nessun dominio configurato su questo account</div>
        ) : allDomains.map((d: any, idx: number) => {
          const renewalCost = domainRenewalCostThisMonth(d)
          const registrar = domainRegistrar(d)
          const renewal = domainNextRenewal(d)
          const isVercelManaged = d.serviceType === 'zeit' || !!d.price
          const isLast = idx === allDomains.length - 1
          return (
            <details key={d.id ?? d.name} className="group">
              <summary className={`grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 ${!isLast ? 'border-b border-gray-50' : ''} hover:bg-gray-50 cursor-pointer list-none transition-colors`}>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
                  <span className="text-sm text-gray-800">{d.name}</span>
                  {d.verified
                    ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    : <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                  }
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-400">{registrar}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${renewalCost > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                    {renewalCost > 0 ? `$${renewalCost.toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              </summary>
              <div className={`px-6 py-4 bg-gray-50 ${!isLast ? 'border-b border-gray-100' : ''} text-xs text-gray-500 space-y-1`}>
                <p>Registrar: <strong>{registrar}</strong></p>
                <p>Scadenza: <strong>{renewal ?? 'Dato non disponibile'}</strong></p>
                {isVercelManaged && d.price && (
                  <p>Costo annuale: <strong>${d.price}/anno</strong> — addebitato nel mese di rinnovo ({new Date(d.boughtAt).toLocaleDateString('it-IT', { month: 'long' })})</p>
                )}
                {!isVercelManaged && (
                  <p>Dominio gestito esternamente — nessun costo su Vercel</p>
                )}
                {d.nameservers?.length > 0 && (
                  <p className="text-gray-400 font-mono">NS: {d.nameservers.slice(0, 2).join(', ')}</p>
                )}
              </div>
            </details>
          )
        })}
      </div>

      {/* App data */}
      {(() => {
        const items: { label: string; value: string }[] = []
        if (allDeployments.length > 0) items.push({ label: 'Deployment (ultimi 50)', value: allDeployments.length.toLocaleString('it-IT') })
        if (lastDeploy?.createdAt) items.push({ label: 'Ultimo deployment', value: new Date(lastDeploy.createdAt).toLocaleDateString('it-IT') })
        if (items.length === 0) return null
        return (
          <>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Statistiche app</h2>
            <div className={`grid gap-4 mb-8 ${items.length === 1 ? 'grid-cols-1' : items.length === 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {items.map(({ label, value }) => (
                <div key={label} className="border border-gray-200 bg-white px-6 py-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">{label}</p>
                  <p className="text-xl font-bold tabular-nums text-gray-900 truncate">{value}</p>
                </div>
              ))}
            </div>
          </>
        )
      })()}

      {/* Deployments table */}
      {allDeployments.length > 0 && (
        <>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Deployment recenti</h2>
          <div className="border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['URL', 'Stato', 'Branch', 'Durata', 'Data'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDeployments.slice(0, 10).map((dep: any) => {
                  const buildDur = dep.buildingAt && dep.ready
                    ? Math.round((dep.ready - dep.buildingAt) / 1000)
                    : null
                  return (
                    <tr key={dep.uid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 max-w-[220px] overflow-hidden">
                        <a href={`https://${dep.url}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-mono text-gray-600 hover:text-gray-900 truncate block flex items-center gap-1">
                          {dep.url?.slice(0, 35)}{dep.url?.length > 35 ? '…' : ''} <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        {dep.meta?.githubCommitMessage && (
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{dep.meta.githubCommitMessage}</p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          {deployStateIcon(dep.readyState ?? dep.state ?? '')}
                          <span className="text-xs text-gray-500">{dep.readyState ?? dep.state ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400 font-mono">{dep.meta?.githubCommitRef ?? '—'}</td>
                      <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                        {buildDur != null ? `${buildDur}s` : '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {dep.createdAt ? new Date(dep.createdAt).toLocaleDateString('it-IT') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
