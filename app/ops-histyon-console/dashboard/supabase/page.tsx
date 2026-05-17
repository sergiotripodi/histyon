import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ArrowLeft, ExternalLink, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Supabase — Console Histyon' }

async function fetchSupabaseManagementData() {
  const token = process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN!
  const projectId = process.env.ADMIN_SUPABASE_PROJECT_ID!
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const [orgRes, projectRes] = await Promise.all([
    fetch(`https://api.supabase.com/v1/organizations`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.supabase.com/v1/projects/${projectId}`, { headers, next: { revalidate: 300 } }),
  ])
  const [orgs, project] = await Promise.all([orgRes.json(), projectRes.json()])
  const org = Array.isArray(orgs) ? orgs[0] : null
  return { org, project }
}

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

const FREE_LIMITS = {
  storage: { limit: 1 * 1024 * 1024 * 1024, unit: 'GB', label: 'Storage DB (PostgreSQL)' },
  fileStorage: { limit: 1 * 1024 * 1024 * 1024, unit: 'GB', label: 'File storage (bucket Supabase)' },
  mau: { limit: 50000, unit: 'MAU', label: 'Monthly Active Users (MAU)' },
  bandwidth: { limit: 5 * 1024 * 1024 * 1024, unit: 'GB', label: 'Egress bandwidth' },
  apiRequests: { limit: 500000, unit: 'req/mese', label: 'Richieste API' },
  edgeFunctions: { limit: 500000, unit: 'invocazioni', label: 'Edge functions invocazioni' },
}

const pricingRows = [
  { tier: 'Free', price: '$0/mese' },
  { tier: 'Pro', price: '$25/mese' },
  { tier: 'Storage DB extra (Pro)', price: '$0.125/GB/mese oltre 8GB' },
  { tier: 'File storage extra (Pro)', price: '$0.021/GB/mese oltre 100GB' },
  { tier: 'MAU extra (Pro)', price: '$0.00325/MAU oltre 50k' },
  { tier: 'Bandwidth extra (Pro)', price: '$0.09/GB oltre 250GB' },
]

export default async function AdminSupabasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { org, project } = await fetchSupabaseManagementData()

  const [
    { count: totalUsers },
    { count: totalTickets },
    { data: storageData },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('tickets').select('file_size'),
  ])

  const appStorageBytes = (storageData ?? []).reduce((s, t) => s + ((t as any).file_size ?? 0), 0)

  const plan = org?.plan ?? 'free'
  const isPro = plan === 'pro'
  const baseCost = isPro ? 25 : 0

  const usageMap = {
    storage: appStorageBytes,
    fileStorage: 0,
    mau: totalUsers ?? 0,
    bandwidth: 0,
    apiRequests: 0,
    edgeFunctions: 0,
  }

  const details = [
    { label: 'Nome progetto', value: project?.name ?? '—' },
    { label: 'Creato il', value: project?.created_at ? new Date(project.created_at).toLocaleDateString('it-IT') : 'Dato non disponibile' },
    { label: 'Regione', value: project?.region ?? 'Dato non disponibile' },
    { label: 'Piano', value: isPro ? 'Pro' : 'Free' },
    { label: 'Stato', value: project?.status ? `● ${project.status}` : '● Dato non disponibile', green: project?.status?.includes('HEALTHY') || project?.status?.includes('ACTIVE') },
    { label: 'Versione', value: project?.database?.version ? `PostgreSQL v${project.database.version}` : 'Dato non disponibile' },
  ]

  return (
    <div className="py-10 px-8">
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3ECF8E] flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em]">Supabase</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{project?.name ?? 'histyon-db'}</h1>
          </div>
        </div>
        <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
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
          {isPro ? (
            <p className="text-4xl font-bold tabular-nums text-gray-900">${baseCost.toFixed(2)}</p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Nessun pagamento pianificato</p>
          )}
        </div>
      </div>

      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Composizione costo</h2>
      <div className="border border-gray-200 bg-white mb-8 divide-y divide-gray-100">
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-sm text-gray-700">Piano {isPro ? 'Pro' : 'Free'}</span>
          <span className="text-sm font-bold text-gray-900">${baseCost.toFixed(2)}</span>
        </div>
        {(Object.entries(FREE_LIMITS) as [keyof typeof FREE_LIMITS, typeof FREE_LIMITS[keyof typeof FREE_LIMITS]][]).map(([key, { label, limit, unit }]) => {
          const used = usageMap[key] ?? 0
          const pct = Math.min((used / Math.max(limit, 1)) * 100, 100)
          const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-gray-900'

          const fmt = unit === 'GB'
            ? (v: number) => formatBytes(v)
            : (v: number) => v.toLocaleString('it-IT')

          return (
            <div key={key} className="flex items-center gap-6 px-6 py-4">
              <div className="w-52 shrink-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{label}</p>
              </div>
              <div className="flex-1">
                <div className="h-1 bg-gray-100 w-full">
                  <div className={`h-full ${color} transition-all`} style={{ width: `${pct.toFixed(1)}%` }} />
                </div>
              </div>
              <div className="text-right w-48 shrink-0">
                <span className="text-xs font-mono text-gray-600">
                  {fmt(used)} / {unit === 'GB' ? formatBytes(limit) : limit.toLocaleString()} {unit !== 'GB' ? unit : ''}
                </span>
              </div>
              <div className="w-20 text-right shrink-0">
                <span className="text-xs font-medium text-gray-400">incluso</span>
              </div>
            </div>
          )
        })}
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

      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Dati applicazione</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Medici registrati', value: (totalUsers ?? 0).toLocaleString('it-IT') },
          { label: 'Ticket totali', value: (totalTickets ?? 0).toLocaleString('it-IT') },
          { label: 'Storage file analisi (R2)', value: formatBytes(appStorageBytes) },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 bg-white px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">{label}</p>
            <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
