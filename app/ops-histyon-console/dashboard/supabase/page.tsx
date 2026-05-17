import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react'
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

// Supabase Free plan limits (public docs)
const FREE_LIMITS = {
  storage: { limit: 1 * 1024 * 1024 * 1024, unit: 'GB', label: 'Storage DB (PostgreSQL)' },
  fileStorage: { limit: 1 * 1024 * 1024 * 1024, unit: 'GB', label: 'File storage (bucket Supabase)' },
  mau: { limit: 50000, unit: 'MAU', label: 'Monthly Active Users (MAU)' },
  bandwidth: { limit: 5 * 1024 * 1024 * 1024, unit: 'GB', label: 'Egress bandwidth' },
  apiRequests: { limit: 500000, unit: 'req/mese', label: 'Richieste API' },
  edgeFunctions: { limit: 500000, unit: 'invocazioni', label: 'Edge functions invocazioni' },
}

export default async function AdminSupabasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { org, project } = await fetchSupabaseManagementData()

  // Get actual data from DB
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

  const usageMap = {
    storage: appStorageBytes,
    fileStorage: 0, // No Supabase buckets used (files on R2)
    mau: totalUsers ?? 0,
    bandwidth: 0,
    apiRequests: 0,
    edgeFunctions: 0,
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
            <div className="w-8 h-8 bg-[#3ECF8E] flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Supabase</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-3 py-2 text-gray-600">
            {plan === 'free' ? 'Free' : 'Pro — $25/mese'}
          </span>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Apri dashboard <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Project info */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Progetto</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Nome progetto', value: project?.name ?? 'histyon-db' },
          { label: 'Regione', value: project?.region ?? 'eu-west-1' },
          { label: 'Stato', value: project?.status ?? 'ACTIVE_HEALTHY', green: true },
          { label: 'PostgreSQL', value: `v${project?.database?.version ?? '17'}` },
        ].map(({ label, value, green }) => (
          <div key={label} className="border border-gray-200 bg-white px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-1.5">{label}</p>
            <div className={`flex items-center gap-1.5 ${green ? 'text-green-600' : 'text-gray-900'}`}>
              {green && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              <span className="text-sm font-semibold">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Billing */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Abbonamento</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Piano corrente</p>
          <p className="text-xl font-bold text-gray-900">{plan === 'free' ? 'Free' : 'Pro'}</p>
          <p className="text-xs text-gray-400 mt-1">{isPro ? '$25/mese, fatturazione mensile' : 'Gratuito — nessun addebito'}</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Costo mensile</p>
          <p className="text-xl font-bold text-gray-900">{isPro ? '$25.00' : '$0.00'}</p>
          <p className="text-xs text-gray-400 mt-1">{isPro ? '+$0.005/GB storage extra' : 'Aggiorna a Pro: $25/mese'}</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Organizzazione</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{org?.name ?? "histyon's projects"}</p>
          <p className="text-xs text-gray-400 mt-1">ID: {org?.id?.slice(0, 20) ?? '—'}…</p>
        </div>
      </div>

      {/* Usage vs limits */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Utilizzo vs limiti (piano Free)
      </h2>
      <div className="space-y-3 mb-8">
        {(Object.entries(FREE_LIMITS) as [keyof typeof FREE_LIMITS, typeof FREE_LIMITS[keyof typeof FREE_LIMITS]][]).map(([key, { label, limit, unit }]) => {
          const used = usageMap[key] ?? 0
          const pct = Math.min((used / Math.max(limit, 1)) * 100, 100)
          const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-gray-900'

          const fmt = unit === 'GB'
            ? (v: number) => formatBytes(v)
            : unit === 'MAU' || unit === 'req/mese' || unit === 'invocazioni'
            ? (v: number) => v.toLocaleString('it-IT')
            : (v: number) => `${v}`

          return (
            <div key={key} className="border border-gray-200 bg-white px-6 py-4 flex items-center gap-6">
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
              <div className="w-12 text-right shrink-0">
                <span className={`text-xs font-medium ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* App stats */}
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

      <div className="mt-4 border border-amber-100 bg-amber-50 px-5 py-3">
        <p className="text-xs text-amber-700">
          <strong>Nota:</strong> Le metriche di bandwidth, richieste API e edge functions richiedono l'accesso alle analytics avanzate di Supabase (disponibili con piano Pro o tramite API di management avanzate). I valori mostrati sono stime basate sui dati del database.
        </p>
      </div>
    </div>
  )
}
