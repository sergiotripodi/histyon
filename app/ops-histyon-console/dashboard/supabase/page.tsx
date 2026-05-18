import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ArrowLeft, ExternalLink, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Supabase — Console Histyon' }

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
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

  // Try various field names the management API might return
  const dbSizeBytes: number =
    usageJson?.db_size_bytes ??
    usageJson?.metrics?.find?.((m: any) => m.metric === 'db_size')?.usage ??
    0

  return { org, project, dbSizeBytes, monthStr }
}

export default async function AdminSupabasePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
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

  const { org, project, dbSizeBytes } = await fetchSupabaseData(monthStr)

  const [
    { count: totalUsers },
    { count: totalAnalyses },
    { data: storageData },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabaseAdmin.from('tickets').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('tickets').select('file_size'),
  ])

  const appStorageBytes = (storageData ?? []).reduce((s, t) => s + ((t as any).file_size ?? 0), 0)

  const plan = org?.plan ?? 'free'
  const isPro = plan === 'pro'
  const recurringCost = isPro ? 25 : 0
  const addonCost = 0 // no overages on free plan

  // Free plan limits
  const DB_SIZE_LIMIT = 500 * 1024 * 1024 // 500 MB free
  const MAU_LIMIT = 50_000
  const FILE_STORAGE_LIMIT = 1 * 1024 * 1024 * 1024 // 1 GB
  const BANDWIDTH_LIMIT = 5 * 1024 * 1024 * 1024 // 5 GB

  const dbSizeUsed = dbSizeBytes
  const mauUsed = totalUsers ?? 0

  const dbSizePct = Math.min((dbSizeUsed / DB_SIZE_LIMIT) * 100, 200)
  const mauPct = Math.min((mauUsed / MAU_LIMIT) * 100, 200)

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

      {/* Month picker */}
      <Suspense>
        <MonthPicker />
      </Suspense>

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

        {/* Piano Free / Pro */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
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
            <p>Piano Free: <strong>$0/mese</strong> — include 500 MB DB, 50k MAU, 1 GB file storage, 5 GB egress</p>
            <p>Piano Pro: <strong>$25/mese</strong> — include 8 GB DB, 50k MAU, 100 GB file storage, 250 GB egress</p>
          </div>
        </details>

        {/* Storage DB */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Storage DB (PostgreSQL)</span>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentMonth && dbSizeUsed > 0 ? (
                <>
                  <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                    <div
                      className={`h-full transition-all ${dbSizePct >= 100 ? 'bg-red-500' : dbSizePct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
                      style={{ width: `${Math.min(dbSizePct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                    {formatBytes(dbSizeUsed)} / 500 MB
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-300">Dato non disponibile</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia gratuita: <strong>500 MB</strong> (Free), <strong>8 GB</strong> (Pro)</p>
            {!isPro && dbSizePct >= 100 && (
              <p className="text-amber-600 font-medium">⚠ Limite raggiunto — Supabase può mettere il progetto in pausa. Nessun costo extra: aggiorna a Pro per evitarlo.</p>
            )}
            <p>Oltre soglia (Pro): <strong>$0.125/GB/mese</strong></p>
          </div>
        </details>

        {/* MAU */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Monthly Active Users (MAU)</span>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentMonth ? (
                <>
                  <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                    <div
                      className={`h-full transition-all ${mauPct >= 100 ? 'bg-red-500' : mauPct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
                      style={{ width: `${Math.min(mauPct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                    {mauUsed.toLocaleString('it-IT')} / 50k
                  </span>
                </>
              ) : <span className="text-xs text-gray-300">Dato non disponibile</span>}
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Soglia gratuita: <strong>50.000 MAU/mese</strong></p>
            <p>Oltre soglia (Pro): <strong>$0.00325/MAU</strong></p>
          </div>
        </details>

        {/* File storage */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">File storage (bucket Supabase)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
                <div className="h-full bg-gray-800" style={{ width: '0%' }} />
              </div>
              <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                0 B / 1 GB
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>I file analisi sono archiviati su Cloudflare R2, non sui bucket Supabase.</p>
            <p>Soglia gratuita: <strong>1 GB</strong> (Free), <strong>100 GB</strong> (Pro)</p>
          </div>
        </details>

        {/* Bandwidth */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Egress bandwidth</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">Dato non disponibile</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 text-xs text-gray-500 space-y-1">
            <p>Soglia gratuita: <strong>5 GB/mese</strong> (Free), <strong>250 GB/mese</strong> (Pro)</p>
            <p>Oltre soglia (Pro): <strong>$0.09/GB</strong></p>
          </div>
        </details>
      </div>

      {/* App data */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Dati applicazione</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Medici registrati', value: (totalUsers ?? 0).toLocaleString('it-IT') },
          { label: 'Analisi totali', value: (totalAnalyses ?? 0).toLocaleString('it-IT') },
          { label: 'Organizzazione', value: org?.name ?? '—' },
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
