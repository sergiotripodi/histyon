import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink, Globe, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react'
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
    teamRes.json(), projectRes.json(), deploymentsRes.json(), domainsRes.json(),
  ])
  return { team, project, deployments, domains }
}

function detectRegistrar(nameservers: string[]): string {
  if (!nameservers?.length) return 'Dato non disponibile'
  const ns = nameservers.join(' ').toLowerCase()
  if (ns.includes('vercel-dns')) return 'Vercel'
  if (ns.includes('cloudflare')) return 'Cloudflare'
  const match = nameservers[0]?.match(/[^.]+\.[^.]+$/)
  return match ? match[0] : nameservers[0]
}

function deployStateIcon(state: string) {
  if (state === 'READY') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
  if (state === 'ERROR' || state === 'CANCELED') return <XCircle className="w-3.5 h-3.5 text-red-500" />
  return <Clock className="w-3.5 h-3.5 text-amber-500" />
}

export default async function AdminVercelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const { team, project, deployments, domains } = await fetchVercelData()

  const billing = team?.billing ?? {}
  const plan = billing.plan ?? 'hobby'
  const isPro = plan === 'pro'
  const baseCost = isPro ? 20 : 0
  const periodEnd = billing.period?.end
    ? new Date(billing.period.end * 1000).toLocaleDateString('it-IT')
    : null

  const allDomains: any[] = domains?.domains ?? []
  const allDeployments: any[] = deployments?.deployments ?? []
  const lastDeploy = allDeployments[0]

  const details = [
    { label: 'Nome progetto', value: project?.name ?? team?.name ?? '—' },
    { label: 'Creato il', value: team?.createdAt ? new Date(team.createdAt).toLocaleDateString('it-IT') : 'Dato non disponibile' },
    { label: 'Regione', value: 'Dato non disponibile' },
    { label: 'Piano', value: plan === 'hobby' ? 'Hobby (Free)' : plan === 'pro' ? 'Pro' : plan },
    { label: 'Stato', value: lastDeploy?.readyState === 'READY' ? '● Attivo' : lastDeploy ? `● ${lastDeploy.readyState}` : '● Attivo', green: !lastDeploy || lastDeploy.readyState === 'READY' },
    { label: 'Framework', value: project?.framework ?? 'Dato non disponibile' },
  ]

  const pricingRows = [
    { tier: 'Hobby (Free)', price: '$0/mese' },
    { tier: 'Pro', price: '$20/mese per membro' },
    { tier: 'Bandwidth extra (Pro)', price: '$0.15/GB oltre 1TB' },
    { tier: 'Function hours extra', price: '$0.18/GB-ora oltre 1000' },
    { tier: 'Dominio custom (acquistato su Vercel)', price: 'da $14/anno' },
  ]

  return (
    <div className="py-10 px-8">
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

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

      <details className="group mb-8">
        <summary className="list-none cursor-pointer flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 hover:text-gray-600 transition-colors select-none">
          Dettagli account
          <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {details.map(({ label, value, green }) => (
            <div key={label} className="border border-gray-200 bg-white px-5 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-1.5">{label}</p>
              <p className={`text-sm font-semibold truncate ${green ? 'text-green-600' : value === 'Dato non disponibile' ? 'text-gray-300' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>
      </details>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo mensile</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${baseCost.toFixed(2)}</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Prossimo pagamento</p>
          {periodEnd && isPro ? (
            <>
              <p className="text-4xl font-bold tabular-nums text-gray-900">${baseCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-2">{periodEnd}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Nessun pagamento pianificato</p>
          )}
        </div>
      </div>

      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Composizione costo</h2>
      <div className="border border-gray-200 bg-white mb-8 divide-y divide-gray-100">
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-sm text-gray-700">Piano {plan === 'hobby' ? 'Hobby (Free)' : 'Pro'}</span>
          <span className="text-sm font-bold text-gray-900">${baseCost.toFixed(2)}</span>
        </div>
        {!isPro && (
          <div className="px-6 py-3">
            <p className="text-xs text-gray-400">Il piano Hobby include bandwidth, build minutes e function hours nei limiti gratuiti. Nessun addebito aggiuntivo al momento.</p>
          </div>
        )}
      </div>

      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Listino prezzi</h2>
      <div className="border border-gray-200 bg-white mb-8">
        <table className="w-full text-sm">
          <tbody>
            {pricingRows.map(({ tier, price }) => (
              <tr key={tier} className="border-b border-gray-50 last:border-0">
                <td className="px-6 py-3 text-gray-600">{tier}</td>
                <td className="px-6 py-3 text-right font-mono text-gray-900">{price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Domini ({allDomains.length})
      </h2>
      <div className="border border-gray-200 bg-white mb-8">
        {allDomains.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Nessun dominio configurato su Vercel</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Dominio', 'Verificato', 'Scadenza', 'Registrar', 'Nameservers'].map(h => (
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
                  <td className="px-6 py-3">
                    {d.verified ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  </td>
                  <td className="px-6 py-3 text-xs font-mono text-gray-400">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('it-IT') : <span className="text-gray-300">Dato non disponibile</span>}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {detectRegistrar(d.nameservers ?? [])}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                    {d.nameservers?.slice(0, 2).join(', ') ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
                <td className="px-6 py-3 text-xs text-gray-400">
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
