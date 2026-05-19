import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExternalLink, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Vercel — Console Histyon' }

async function fetchVercelData(monthStr: string) {
  const token = process.env.ADMIN_VERCEL_TOKEN!
  const teamId = process.env.ADMIN_VERCEL_TEAM_ID!
  const projectId = process.env.ADMIN_VERCEL_PROJECT_ID!
  const headers = { Authorization: `Bearer ${token}` }

  // Month range for usage queries (ms timestamps)
  const [y, m] = monthStr.split('-').map(Number)
  const monthStartMs = Date.UTC(y, m - 1, 1)
  const monthEndMs   = Date.UTC(y, m, 1) - 1

  const [teamRes, projectRes, deploymentsRes, domainsRes, membersRes, usageRes] = await Promise.all([
    fetch(`https://api.vercel.com/v1/teams/${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=50`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v5/domains?teamId=${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v2/teams/${teamId}/members`, { headers, next: { revalidate: 300 } }).catch(() => null),
    // Usage endpoint — works fully on Pro/Enterprise, returns limited or empty data on Hobby.
    // We try it anyway and only display rows for metrics that return real values.
    fetch(`https://api.vercel.com/v2/teams/${teamId}/usage?from=${monthStartMs}&to=${monthEndMs}`, { headers, next: { revalidate: 300 } }).catch(() => null),
  ])

  const [team, project, deployments, domains] = await Promise.all([
    teamRes.json(), projectRes.json(), deploymentsRes.json(), domainsRes.json(),
  ])
  const members = membersRes?.ok ? await membersRes.json().catch(() => null) : null
  const usage   = usageRes?.ok ? await usageRes.json().catch(() => null) : null

  return { team, project, deployments, domains, members, usage }
}

function deployStateIcon(state: string) {
  if (state === 'READY') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
  if (state === 'ERROR' || state === 'CANCELED') return <XCircle className="w-3.5 h-3.5 text-red-500" />
  return <Clock className="w-3.5 h-3.5 text-amber-500" />
}

export default async function AdminVercelPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const sp = await searchParams
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthStr = sp.month ?? currentMonth
  const isCurrentMonth = monthStr === currentMonth

  const { team, project, deployments, domains, members, usage } = await fetchVercelData(monthStr)

  const billing = team?.billing ?? {}
  const plan = billing.plan ?? 'hobby'
  const isPro = plan === 'pro'

  const allDomains: any[] = domains?.domains ?? []
  const allDeployments: any[] = deployments?.deployments ?? []
  const lastDeploy = allDeployments[0]

  // Domains: per-domain cost logic
  // Vercel-registered domains have serviceType='zeit' or a price field + boughtAt
  // Annual billing: cost appears only in the renewal month (same calendar month as boughtAt)
  const selectedMonthNum = Number(monthStr.split('-')[1])

  function domainRenewalCostThisMonth(d: any): number {
    if (!d.price || !d.boughtAt) return 0
    const bought = new Date(d.boughtAt)
    // Renewal happens same month each year
    if (bought.getMonth() + 1 === selectedMonthNum) return d.price
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

  // Member count influences price on Pro ($20/member). Recurring cost auto-adapts.
  const memberCount: number = Array.isArray(members?.members) ? members.members.length : 0
  const billableMembers = Math.max(1, memberCount) // Vercel charges at least 1
  const recurringCost = isPro ? 20 * billableMembers : 0

  // ── Vercel usage metrics ────────────────────────────────────────────────
  // The Vercel /v2/teams/{id}/usage endpoint returns numeric usage per metric.
  // On Hobby plan many metrics return 0 or aren't included. We only render rows
  // where the API returned a meaningful value (>= 0 and the field exists).
  // When the team upgrades to Pro/Enterprise these rows will auto-populate.
  //
  // Each metric has: { key, label, included (free tier), unit formatter, overagePerUnit, hint }
  const USAGE_METRICS: Array<{
    key: string
    label: string
    included: number
    format: (v: number) => string
    overagePerUnit: number  // $ per single unit above included
    hint: string
  }> = [
    { key: 'bandwidth',             label: 'Fast Data Transfer',          included: 100 * 1024**3, format: bytes,   overagePerUnit: 0.15 / 1024**3, hint: 'Banda dati servita dalla CDN — Hobby 100 GB · Pro 1 TB · oltre $0.15/GB' },
    { key: 'edgeRequest',           label: 'Edge Requests',                included: 1_000_000,    format: nFmt,    overagePerUnit: 2.00 / 1_000_000, hint: 'Richieste edge — Hobby 1M · Pro 10M · oltre $2/M' },
    { key: 'functionInvocation',    label: 'Function Invocations',         included: 100_000,      format: nFmt,    overagePerUnit: 0.60 / 1_000_000, hint: 'Esecuzioni serverless — Hobby 100k · Pro 1M · oltre $0.60/M' },
    { key: 'functionDuration',      label: 'Function Duration (GB-Hr)',    included: 100,          format: (v) => `${v.toFixed(1)} GB-h`, overagePerUnit: 0.18, hint: 'Tempo esecuzione funzioni — Hobby 100 GB-Hr · Pro 1000 · oltre $0.18/GB-Hr' },
    { key: 'edgeMiddlewareInvocations', label: 'Edge Middleware',          included: 1_000_000,    format: nFmt,    overagePerUnit: 0.65 / 1_000_000, hint: 'Hobby 1M · Pro illimitato · oltre $0.65/M' },
    { key: 'imageOptimization',     label: 'Image Optimization (sources)', included: 1_000,        format: nFmt,    overagePerUnit: 5.00 / 1_000, hint: 'Sorgenti immagini ottimizzate — Hobby 1k · Pro 5k · oltre $5/1k' },
    { key: 'sourceImagesCount',     label: 'Image Optimization (sources)', included: 1_000,        format: nFmt,    overagePerUnit: 5.00 / 1_000, hint: 'Alias del campo imageOptimization usato da alcune versioni API' },
    { key: 'webAnalyticsEvents',    label: 'Web Analytics Events',         included: 25_000,       format: nFmt,    overagePerUnit: 14 / 100_000, hint: 'Hobby 25k · Pro 100k incluso · oltre $14/100k' },
    { key: 'fluidActiveCpu',        label: 'Fluid Active CPU (h)',         included: 0,            format: (v) => `${v.toFixed(2)} h`, overagePerUnit: 0.128, hint: 'Pro: $0.128/h CPU attivo Fluid' },
    { key: 'fluidProvisionedMemory', label: 'Fluid Provisioned Memory (GB-h)', included: 0,         format: (v) => `${v.toFixed(2)} GB-h`, overagePerUnit: 0.0106, hint: 'Pro: $0.0106/GB-h memoria provisioned Fluid' },
  ]

  function bytes(v: number): string {
    if (v >= 1024**3) return `${(v / 1024**3).toFixed(2)} GB`
    if (v >= 1024**2) return `${(v / 1024**2).toFixed(1)} MB`
    if (v >= 1024)    return `${(v / 1024).toFixed(1)} KB`
    return `${v} B`
  }
  function nFmt(v: number): string { return v.toLocaleString('it-IT') }

  // Extract values: usage shape is { bandwidth: number, edgeRequest: number, ... }
  // Some Vercel API versions wrap values as { value: number }; handle both.
  function extractUsageValue(field: string): number | null {
    if (!usage || typeof usage !== 'object') return null
    const raw = (usage as any)[field]
    if (raw == null) return null
    if (typeof raw === 'number') return raw
    if (typeof raw === 'object' && typeof raw.value === 'number') return raw.value
    return null
  }

  // Build the list of usage rows that have real data (>= 0 and field present)
  const usageRows = USAGE_METRICS
    .map(m => ({ ...m, value: extractUsageValue(m.key) }))
    .filter(m => m.value !== null && m.value !== undefined)
    // dedupe by label (some metrics are aliases like imageOptimization vs sourceImagesCount)
    .filter((m, i, arr) => arr.findIndex(x => x.label === m.label) === i)
    .map(m => {
      const v = m.value as number
      const overage = Math.max(0, v - m.included)
      const cost = overage * m.overagePerUnit
      return { ...m, value: v, overage, cost }
    })

  const usageAddonCost = usageRows.reduce((s, r) => s + r.cost, 0)
  const addonCost = domainAddonCost + usageAddonCost

  const monthLabel = new Date(monthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{project?.name ?? team?.name ?? 'histyon'}</h1>
        </div>
        <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
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
          <p className="text-xs text-gray-400 mt-2">Piano {isPro ? 'Pro' : 'Hobby (Free)'}</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo add-on</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${addonCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Utilizzo oltre soglie incluse nel piano</p>
        </div>
      </div>

      {/* Unified cost table */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Dettaglio costi — {monthLabel}
        {!isCurrentMonth && <span className="ml-2 text-gray-300 font-normal normal-case">(storico)</span>}
      </h2>
      {!isCurrentMonth && (
        <p className="text-xs text-gray-400 mb-4">Dati storici non disponibili via API Vercel. Vengono mostrati i dati live correnti.</p>
      )}
      <div className="border border-gray-200 bg-white mb-8">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Voce</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Utilizzo</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 text-right">Costo</p>
        </div>

        {/* Piano Hobby */}
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
            {isPro && memberCount > 0 && (
              <p className="text-gray-700">Membri attivi: <strong>{memberCount}</strong> × $20 = <strong>${recurringCost.toFixed(2)}/mese</strong></p>
            )}
          </div>
        </details>

        {/* Usage rows — only metrics actually returned by Vercel API */}
        {usageRows.map((r, idx) => {
          const pct = r.included > 0 ? Math.min((r.value / r.included) * 100, 200) : 0
          const isLast = idx === usageRows.length - 1 && allDomains.length === 0
          return (
            <details key={r.key} className="group">
              <summary className={`grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 ${!isLast ? 'border-b border-gray-50' : ''} hover:bg-gray-50 cursor-pointer list-none transition-colors`}>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
                  <span className="text-sm text-gray-800">{r.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.included > 0 ? (
                    <>
                      <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                        <div
                          className={`h-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                        {r.format(r.value)} / {r.format(r.included)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-500">{r.format(r.value)}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${r.cost > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {r.cost > 0 ? `$${r.cost.toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              </summary>
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
                <p>{r.hint}</p>
                {r.overage > 0 && (
                  <p className="text-red-600">Overage: {r.format(r.overage)} oltre la soglia inclusa.</p>
                )}
              </div>
            </details>
          )
        })}

        {/* Domini — one row per domain */}
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

      {/* App data — only essential business metrics. Cost-influencing fields go in the table above. */}
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
