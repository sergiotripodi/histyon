import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExternalLink, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { MonthBadge } from '@/components/admin/MonthBadge'
import { getBillingPeriodMs } from '@/lib/billing/config'
import { fetchVercelBilling } from '@/lib/vercel/billing'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Vercel' }

/**
 * Pagina Vercel — fonte unica dei costi: GET /v1/billing/charges (FOCUS v1.3 JSONL)
 *
 * Tutti i numeri di costo qui vengono direttamente dalla billing API ufficiale.
 * Nessun calcolo manuale di overage, nessun hardcoding di prezzi: i dati arrivano
 * con `BilledCost` (lordo) e `EffectiveCost` (netto post-crediti) per ogni servizio.
 *
 * Endpoint di supporto:
 *  - /v2/teams/{id}             → info team (plan, members, billing period)
 *  - /v9/projects/{id}          → info progetto
 *  - /v6/deployments            → ultimi deployment
 *  - /v5/domains                → lista domini (data acquisto, scadenza, prezzo)
 */

async function fetchVercelInfo(monthStr: string) {
  const token = process.env.ADMIN_VERCEL_TOKEN!
  const teamId = process.env.ADMIN_VERCEL_TEAM_ID!
  const projectId = process.env.ADMIN_VERCEL_PROJECT_ID!
  const headers = { Authorization: `Bearer ${token}` }

  // Periodo di fatturazione reale (giorno 24 → 23) anche per le query usage
  const { startMs, endMs } = getBillingPeriodMs(monthStr)

  const [teamRes, projectRes, deploymentsRes, domainsRes, membersRes, billing] = await Promise.all([
    fetch(`https://api.vercel.com/v2/teams/${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=50`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v5/domains?teamId=${teamId}`, { headers, next: { revalidate: 30 } }),
    fetch(`https://api.vercel.com/v3/teams/${teamId}/members`, { headers, next: { revalidate: 300 } }).catch(() => null),
    fetchVercelBilling({ token, teamId, fromMs: startMs, toMs: endMs, revalidate: 300 }),
  ])

  const [team, project, deployments, domains] = await Promise.all([
    teamRes.json().catch(() => null),
    projectRes.json().catch(() => null),
    deploymentsRes.json().catch(() => null),
    domainsRes.json().catch(() => null),
  ])
  const members = membersRes?.ok ? await membersRes.json().catch(() => null) : null

  return { team, project, deployments, domains, members, billing }
}

function deployStateIcon(state: string) {
  if (state === 'READY') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
  if (state === 'ERROR' || state === 'CANCELED') return <XCircle className="w-3.5 h-3.5 text-red-500" />
  return <Clock className="w-3.5 h-3.5 text-amber-500" />
}

function fmtUnit(qty: number, unit: string): string {
  if (!unit) return qty.toLocaleString('it-IT')
  const u = unit.toLowerCase()
  // Byte units
  if (u === 'bytes' || u === 'b') {
    if (qty >= 1024 ** 3) return `${(qty / 1024 ** 3).toFixed(2)} GB`
    if (qty >= 1024 ** 2) return `${(qty / 1024 ** 2).toFixed(1)} MB`
    if (qty >= 1024) return `${(qty / 1024).toFixed(1)} KB`
    return `${qty} B`
  }
  if (u === 'gb' || u === 'gigabytes') return `${qty.toFixed(2)} GB`
  if (u === 'mb') return `${qty.toFixed(1)} MB`
  // Numerical units (requests, invocations)
  if (qty >= 1_000_000) return `${(qty / 1_000_000).toFixed(2)}M ${unit}`
  if (qty >= 1_000) return `${(qty / 1_000).toFixed(1)}K ${unit}`
  return `${qty.toLocaleString('it-IT')} ${unit}`
}

export default async function AdminVercelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const monthStr = new Date().toISOString().slice(0, 7)

  const { team, project, deployments, domains, members, billing } = await fetchVercelInfo(monthStr)

  const teamBilling = team?.billing ?? {}
  const plan: string = teamBilling.plan ?? 'hobby'
  const isPro = plan !== 'hobby' && plan !== 'free'

  // Periodo fatturazione dal team API (se disponibile)
  const periodStart: number | null = teamBilling.period?.start ?? null
  const periodEnd: number | null = teamBilling.period?.end ?? null

  const allDomains: any[] = domains?.domains ?? []
  const allDeployments: any[] = deployments?.deployments ?? []
  const lastDeploy = allDeployments[0]
  const memberCount: number = Array.isArray(members?.members) ? members.members.length : 0

  // ── Dati REALI dalla billing API ─────────────────────────────────────────
  // Tutto viene da /v1/billing/charges (formato FOCUS v1.3)
  // Nessun calcolo, nessuna stima, nessun hardcoding
  const billingOk = billing.ok
  const totalBilled    = billing.totalBilled
  const totalEffective = billing.totalEffective
  const creditsApplied = billing.creditsApplied   // valore positivo: $20.00 di credito Pro
  const services       = billing.services         // già aggregati per ServiceName

  // Helper per categorizzare servizi
  function isSubscription(name: string): boolean {
    return /pro plan|subscription|hobby plan|enterprise plan/i.test(name)
  }

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

      {/* Cost summary boxes — dati REALI da /v1/billing/charges */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Lordo</p>
          <p className="text-3xl font-bold tabular-nums text-gray-900">${totalBilled.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Somma BilledCost di tutti i servizi</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Crediti applicati</p>
          <p className="text-3xl font-bold tabular-nums text-green-600">−${creditsApplied.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Crediti infrastrutturali del piano</p>
        </div>
        <div className="border border-gray-900 bg-gray-900 px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Netto effettivo</p>
          <p className="text-3xl font-bold tabular-nums text-white">${totalEffective.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Quello che pagherai realmente</p>
        </div>
      </div>

      {/* Dettaglio costi reali */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Dettaglio costi del ciclo corrente</h2>
        <MonthBadge monthStr={monthStr} live />
      </div>

      {!billingOk ? (
        <div className="border border-amber-200 bg-amber-50 px-6 py-4 mb-8">
          <p className="text-xs font-bold text-amber-700 mb-1">API billing non disponibile</p>
          <p className="text-xs text-amber-600 font-mono">{billing.error ?? `HTTP ${billing.status}`}</p>
          <p className="text-[11px] text-amber-700 mt-2">
            L&apos;endpoint <code>/v1/billing/charges</code> è disponibile solo su team Pro/Enterprise. Verifica:
            (a) il piano è Pro · (b) il token ha ruolo Owner/Billing · (c) team ID corretto.
          </p>
        </div>
      ) : services.length === 0 ? (
        <div className="border border-gray-200 bg-white px-6 py-4 mb-8 text-xs text-gray-400">
          Nessun addebito registrato nel ciclo corrente (il ciclo è appena iniziato il giorno 24).
        </div>
      ) : (
        <div className="border border-gray-200 bg-white mb-8">
          <div className="grid grid-cols-[1fr_180px_100px_100px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Servizio</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Consumo</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 text-right">Lordo</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 text-right">Netto</p>
          </div>

          {services.map((s, idx) => {
            const isLast = idx === services.length - 1
            const isSub = isSubscription(s.name)
            const credit = s.billedCost - s.effectiveCost
            return (
              <div key={s.name}
                className={`grid grid-cols-[1fr_180px_100px_100px] gap-4 px-6 py-3 ${!isLast ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}>
                <div className="flex items-center gap-2 min-w-0">
                  {isSub
                    ? <span className="text-[9px] font-bold uppercase tracking-wider text-gray-900 bg-gray-100 px-1.5 py-0.5">PIANO</span>
                    : <ChevronRight className="w-3 h-3 text-gray-200 shrink-0" />
                  }
                  <span className="text-sm text-gray-800 truncate">{s.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-[11px] font-mono text-gray-500">
                    {s.quantity > 0 ? fmtUnit(s.quantity, s.unit) : '—'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-gray-500">${s.billedCost.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold tabular-nums ${s.effectiveCost > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                    ${s.effectiveCost.toFixed(2)}
                  </span>
                  {credit > 0.001 && (
                    <p className="text-[9px] text-green-600 mt-0.5">−${credit.toFixed(2)} crediti</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Domini — sezione separata con TUTTI i domini, non solo quelli del mese */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Domini</h2>
      <div className="border border-gray-200 bg-white mb-8">
        <div className="grid grid-cols-[1fr_140px_140px_120px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Dominio</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Acquistato</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Rinnovo</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 text-right">Costo/anno</p>
        </div>
        {allDomains.length === 0 ? (
          <div className="px-6 py-4 text-xs text-gray-300">Nessun dominio configurato</div>
        ) : allDomains.map((d: any, idx: number) => {
          const bought = d.boughtAt ? new Date(d.boughtAt).toLocaleDateString('it-IT') : null
          const expires = d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('it-IT') : null
          const isVercelManaged = d.serviceType === 'zeit' || !!d.price
          const isLast = idx === allDomains.length - 1
          return (
            <div key={d.id ?? d.name}
              className={`grid grid-cols-[1fr_140px_140px_120px] gap-4 px-6 py-3 ${!isLast ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-mono text-gray-800 truncate">{d.name}</span>
                {d.verified
                  ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  : <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                }
              </div>
              <span className="text-xs text-gray-500 font-mono">{bought ?? '—'}</span>
              <span className="text-xs text-gray-500 font-mono">{expires ?? '—'}</span>
              <span className={`text-sm font-bold tabular-nums text-right ${isVercelManaged ? 'text-gray-900' : 'text-gray-300'}`}>
                {isVercelManaged && d.price ? `$${Number(d.price).toFixed(2)}` : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Info piano */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Piano e ciclo</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Piano attivo</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900">{plan}</p>
          <p className="text-xs text-gray-400 mt-1">{memberCount > 0 ? `${memberCount} membri` : '—'}</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Inizio ciclo</p>
          <p className="text-lg font-bold tabular-nums text-gray-900">
            {periodStart ? new Date(periodStart).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">da team.billing.period.start</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Fine ciclo</p>
          <p className="text-lg font-bold tabular-nums text-gray-900">
            {periodEnd ? new Date(periodEnd).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">da team.billing.period.end</p>
        </div>
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
            <div className={`grid gap-4 mb-8 ${items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
