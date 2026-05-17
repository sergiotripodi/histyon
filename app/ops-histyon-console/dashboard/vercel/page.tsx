import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink, Globe, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

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
    fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=10`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.vercel.com/v5/domains?teamId=${teamId}`, { headers, next: { revalidate: 300 } }),
  ])

  const [team, project, deployments, domains] = await Promise.all([
    teamRes.json(),
    projectRes.json(),
    deploymentsRes.json(),
    domainsRes.json(),
  ])

  return { team, project, deployments, domains }
}

function planLabel(plan: string): string {
  const map: Record<string, string> = { hobby: 'Hobby (Free)', pro: 'Pro', enterprise: 'Enterprise' }
  return map[plan] ?? plan
}

function deployStateIcon(state: string) {
  if (state === 'READY') return <CheckCircle2 className="w-4 h-4 text-green-500" />
  if (state === 'ERROR' || state === 'CANCELED') return <XCircle className="w-4 h-4 text-red-500" />
  return <Clock className="w-4 h-4 text-amber-500" />
}

export default async function AdminVercelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const { team, project, deployments, domains } = await fetchVercelData()

  const billing = team?.billing ?? {}
  const plan = billing.plan ?? 'hobby'
  const isPro = plan === 'pro'
  const monthlyCost = isPro ? 20 : 0

  const allDomains: any[] = domains?.domains ?? []
  const allDeployments: any[] = deployments?.deployments ?? []

  // Hobby plan limits (Vercel public docs)
  const HOBBY_LIMITS = {
    bandwidth: { used: 0, limit: 100, unit: 'GB', label: 'Bandwidth' },
    builds: { used: allDeployments.length, limit: 6000, unit: 'min/mo', label: 'Build minutes' },
    deployments: { used: allDeployments.length, limit: 100, unit: '/day', label: 'Deployments/giorno' },
    functions: { used: 0, limit: 100, unit: 'GB-ore', label: 'Function hours' },
    edgeRequests: { used: 0, limit: 1000000, unit: 'req', label: 'Edge requests' },
  }

  return (
    <div className="py-10 px-8">
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">Servizio</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 flex items-center justify-center">
              <span className="text-white text-sm font-bold">▲</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vercel</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-3 py-2 text-gray-600">
            {planLabel(plan)}
          </span>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Apri dashboard <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Billing */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Abbonamento</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Piano corrente</p>
          <p className="text-xl font-bold text-gray-900">{planLabel(plan)}</p>
          <p className="text-xs text-gray-400 mt-1">{isPro ? 'Fatturazione mensile' : 'Gratuito — nessun addebito'}</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Costo mensile base</p>
          <p className="text-xl font-bold text-gray-900">${monthlyCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{isPro ? '+costi aggiuntivi per usage' : 'Nessun costo aggiuntivo'}</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Email fatturazione</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{billing.email ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{billing.address?.country ?? '—'}</p>
        </div>
      </div>

      {/* Usage limits */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Limiti piano {planLabel(plan)}
      </h2>
      <div className="grid grid-cols-1 gap-3 mb-8">
        {Object.values(HOBBY_LIMITS).map(({ label, used, limit, unit }) => {
          const pct = Math.min((used / Math.max(limit, 1)) * 100, 100)
          const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-gray-900'
          return (
            <div key={label} className="border border-gray-200 bg-white px-6 py-4 flex items-center gap-6">
              <div className="w-48 shrink-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{label}</p>
              </div>
              <div className="flex-1">
                <div className="h-1 bg-gray-100 w-full">
                  <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="text-right w-40 shrink-0">
                <span className="text-xs font-mono text-gray-600">{used.toLocaleString()} / {limit.toLocaleString()} {unit}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Domains */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Domini ({allDomains.length})
      </h2>
      <div className="border border-gray-200 bg-white mb-8">
        {allDomains.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Nessun dominio configurato</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Dominio', 'Tipo', 'CDN', 'Verificato', 'Scadenza', 'Nameservers'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDomains.map((d: any) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{d.serviceType ?? 'external'}</td>
                  <td className="px-6 py-3">
                    {d.cdnEnabled
                      ? <span className="text-green-600 text-xs font-medium">● Attivo</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-6 py-3">
                    {d.verified
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />
                    }
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs font-mono">
                    {d.expiresAt
                      ? new Date(d.expiresAt).toLocaleDateString('it-IT')
                      : <span className="text-amber-500">Gestito esternamente</span>
                    }
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {d.nameservers?.slice(0, 2).join(', ') ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-6 py-3 border-t border-gray-50 bg-gray-50">
          <p className="text-[10px] text-gray-400">
            Il dominio histyon.com è gestito da <strong>register.it</strong>. La scadenza va verificata direttamente sul pannello register.it. Quando sposti il dominio su Cloudflare, i dati di scadenza appariranno automaticamente nella sezione Cloudflare.
          </p>
        </div>
      </div>

      {/* Recent deployments */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Deployment recenti
      </h2>
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
                  <a
                    href={`https://${dep.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    {dep.url?.slice(0, 40)}… <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-1.5">
                    {deployStateIcon(dep.readyState ?? dep.state)}
                    <span className="text-xs text-gray-500">{dep.readyState ?? dep.state}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-xs text-gray-400 font-mono">{dep.meta?.githubCommitRef ?? '—'}</td>
                <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                  {dep.createdAt ? new Date(dep.createdAt).toLocaleDateString('it-IT') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
