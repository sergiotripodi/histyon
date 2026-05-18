import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Vercel — Console Histyon' }

async function fetchVercelData() {
  const token = process.env.ADMIN_VERCEL_TOKEN!
  const teamId = process.env.ADMIN_VERCEL_TEAM_ID!
  const projectId = process.env.ADMIN_VERCEL_PROJECT_ID!
  const headers = { Authorization: `Bearer ${token}` }

  const [teamRes, projectRes, deploymentsRes, domainsRes] = await Promise.all([
    fetch(`https://api.vercel.com/v1/teams/${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=20`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v5/domains?teamId=${teamId}`, { headers, next: { revalidate: 300 } }),
  ])

  const [team, project, deployments, domains] = await Promise.all([
    teamRes.json(), projectRes.json(), deploymentsRes.json(), domainsRes.json(),
  ])
  return { team, project, deployments, domains }
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

  const { team, project, deployments, domains } = await fetchVercelData()

  const billing = team?.billing ?? {}
  const plan = billing.plan ?? 'hobby'
  const isPro = plan === 'pro'
  const recurringCost = isPro ? 20 : 0

  const allDomains: any[] = domains?.domains ?? []
  const allDeployments: any[] = deployments?.deployments ?? []
  const lastDeploy = allDeployments[0]

  // Domains: per-domain cost logic
  // Vercel-registered domains have serviceType='zeit' or a price field + boughtAt
  // Annual billing: cost appears only in the renewal month (same calendar month as boughtAt)
  const [selectedYear, selectedMonthNum] = monthStr.split('-').map(Number)

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
  const addonCost = domainAddonCost // extend here when other usage-based costs are available

  // Stima build minutes: ogni deployment ~2 min
  const BUILD_MINUTES_LIMIT = 6000
  const buildMinutesUsed = allDeployments.length * 2
  const buildMinutesPct = Math.min((buildMinutesUsed / BUILD_MINUTES_LIMIT) * 100, 200)

  // Bandwidth: dato non disponibile via API hobby
  const BANDWIDTH_LIMIT_GB = 100
  const bandwidthPct = 0

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
          <div className="w-8 h-8 bg-gray-900 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">▲</span>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em]">Vercel</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{project?.name ?? team?.name ?? 'histyon'}</h1>
          </div>
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
          <p className="text-xs text-gray-400 mt-2">Piano {isPro ? 'Pro' : 'Hobby (Free)'} mensile</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo add-on</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${addonCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Dati storici non disponibili via API Vercel</p>
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
          </div>
        </details>

        {/* Bandwidth */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Bandwidth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                <div className="h-full bg-gray-800" style={{ width: `${bandwidthPct}%` }} />
              </div>
              <span className="text-[10px] font-mono text-gray-300 whitespace-nowrap">
                Dato non disponibile / {BANDWIDTH_LIMIT_GB} GB
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia gratuita Hobby: <strong>100 GB/mese</strong></p>
            <p>Soglia Pro: <strong>1 TB/mese</strong> — oltre soglia: $0.15/GB</p>
            <p className="text-gray-400">Il dato di utilizzo bandwidth non è accessibile via API Vercel sul piano Hobby.</p>
          </div>
        </details>

        {/* Build minutes */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Build minutes (stima)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                <div
                  className={`h-full transition-all ${buildMinutesPct >= 100 ? 'bg-red-500' : buildMinutesPct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
                  style={{ width: `${Math.min(buildMinutesPct, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                ~{buildMinutesUsed} / {BUILD_MINUTES_LIMIT.toLocaleString('it-IT')} min
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia gratuita: <strong>6.000 minuti/mese</strong> (Hobby)</p>
            <p>Stima basata su {allDeployments.length} deployment x ~2 min ciascuno.</p>
            <p>Il dato esatto non è accessibile via API Vercel sul piano Hobby.</p>
          </div>
        </details>

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

      {/* App data */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Dati applicazione</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Deployment totali (recenti)', value: allDeployments.length.toLocaleString('it-IT') },
          { label: 'Ultimo deployment', value: lastDeploy ? new Date(lastDeploy.createdAt).toLocaleDateString('it-IT') : '—' },
          { label: 'Framework', value: project?.framework ?? 'nextjs' },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 bg-white px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">{label}</p>
            <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Deployments table */}
      {allDeployments.length > 0 && (
        <>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Deployment recenti</h2>
          <div className="border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['URL', 'Stato', 'Branch', 'Data'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDeployments.slice(0, 10).map((dep: any) => (
                  <tr key={dep.uid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <a href={`https://${dep.url}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-mono text-gray-600 hover:text-gray-900 flex items-center gap-1">
                        {dep.url?.slice(0, 40)}{dep.url?.length > 40 ? '…' : ''} <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        {deployStateIcon(dep.readyState ?? dep.state ?? '')}
                        <span className="text-xs text-gray-500">{dep.readyState ?? dep.state ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">{dep.meta?.githubCommitRef ?? '—'}</td>
                    <td className="px-6 py-3 text-xs text-gray-400">
                      {dep.createdAt ? new Date(dep.createdAt).toLocaleDateString('it-IT') : '—'}
                    </td>
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
