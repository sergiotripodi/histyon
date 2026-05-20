import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagamenti — Console Histyon' }

async function fetchAllCosts(monthStr: string) {
  const vercelToken = process.env.ADMIN_VERCEL_TOKEN!
  const vercelTeamId = process.env.ADMIN_VERCEL_TEAM_ID!
  const sbToken = process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN!

  const [selYear, selMonth] = monthStr.split('-').map(Number)

  const [vercelTeamRes, vercelDomainsRes, sbOrgsRes] = await Promise.all([
    fetch(`https://api.vercel.com/v1/teams/${vercelTeamId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
      next: { revalidate: 300 },
    }),
    fetch(`https://api.vercel.com/v5/domains?teamId=${vercelTeamId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
      next: { revalidate: 300 },
    }).catch(() => null),
    fetch(`https://api.supabase.com/v1/organizations`, {
      headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    }),
  ])

  const [vercelTeam, vercelDomains, sbOrgs] = await Promise.all([
    vercelTeamRes.json(),
    (vercelDomainsRes?.ok ? vercelDomainsRes.json() : Promise.resolve(null)).catch(() => null),
    sbOrgsRes.json(),
  ])

  const vercelPlan = vercelTeam?.billing?.plan ?? 'hobby'
  const vercelMonthlyCost = vercelPlan === 'pro' ? 20 : 0

  const vercelDomainsList: any[] = vercelDomains?.domains ?? []
  const vercelDomainAddon = vercelDomainsList.reduce((s: number, d: any) => {
    if (!d.price || !d.boughtAt) return s
    const renewalMonth = new Date(d.boughtAt).getMonth() + 1
    return renewalMonth === selMonth ? s + d.price : s
  }, 0)

  const sbOrg = Array.isArray(sbOrgs) ? sbOrgs[0] : null
  const sbPlan = sbOrg?.plan ?? 'free'
  const sbMonthlyCost = sbPlan === 'pro' ? 25 : 0
  const sbAddon = 0

  const totalAddon = vercelDomainAddon + sbAddon
  const recurringCost = vercelMonthlyCost + sbMonthlyCost

  return {
    vercel:   { plan: vercelPlan, monthlyCost: vercelMonthlyCost, addonCost: vercelDomainAddon },
    supabase: { plan: sbPlan, monthlyCost: sbMonthlyCost, addonCost: sbAddon, org: sbOrg },
    recurringCost,
    totalAddon,
    unifiedPayments: [] as any[],
  }
}

const SERVICE_COLORS: Record<string, string> = {
  Vercel:   'bg-gray-900',
  Supabase: 'bg-[#3ECF8E]',
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const sp = await searchParams
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthStr = sp.month ?? currentMonth
  const isCurrentMonth = monthStr === currentMonth

  const { vercel, supabase: sb, recurringCost, totalAddon, unifiedPayments } = await fetchAllCosts(monthStr)

  const monthLabel = new Date(monthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  const services = [
    {
      name: 'Vercel',
      monthly: vercel.monthlyCost + vercel.addonCost,
      href: '/ops-histyon-console/dashboard/vercel',
      color: SERVICE_COLORS.Vercel,
      initial: '▲',
    },
    {
      name: 'Supabase',
      monthly: sb.monthlyCost + sb.addonCost,
      href: '/ops-histyon-console/dashboard/supabase',
      color: SERVICE_COLORS.Supabase,
      initial: 'S',
    },
  ]

  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pagamenti e costi</h1>
        </div>
      </div>

      {/* Month picker */}
      <Suspense>
        <MonthPicker />
      </Suspense>

      {/* Cost summary boxes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Spese fisse</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${recurringCost.toFixed(2)}</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Spese aggiuntive</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${totalAddon.toFixed(2)}</p>
        </div>
      </div>

      {/* Per-service breakdown */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Costi per servizio</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {services.map(s => (
          <Link key={s.name} href={s.href} className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
            <div className="flex items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 ${s.color} flex items-center justify-center`}>
                  <span className="text-white text-[10px] font-bold">{s.initial}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{s.name}</span>
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">
              ${s.monthly.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              Vedi dettaglio <ExternalLink className="w-3 h-3" />
            </p>
          </Link>
        ))}
      </div>

      {/* Unified payments table */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Cronologia pagamenti
        {!isCurrentMonth && <span className="ml-2 text-gray-300 font-normal normal-case">(storico)</span>}
      </h2>
      <div className="border border-gray-200 bg-white mb-8">
        {(() => {
          const forecastServices = isCurrentMonth ? services.filter(s => s.monthly > 0) : []
          const hasContent = unifiedPayments.length > 0 || forecastServices.length > 0

          if (!hasContent) {
            return (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-gray-400">Nessun pagamento registrato.</p>
                <p className="text-xs text-gray-300 mt-1">I servizi attivi sono gratuiti e non generano transazioni.</p>
              </div>
            )
          }

          return (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Data', 'Servizio', 'Descrizione', 'Importo'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unifiedPayments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                      {p.date ? p.date.toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 ${SERVICE_COLORS[p.service] ?? 'bg-gray-400'} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-[8px] font-bold">{p.service[0]}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">{p.service}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{p.description}</td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 tabular-nums">${p.amount.toFixed(2)}</td>
                  </tr>
                ))}

                {forecastServices.map(s => (
                  <tr key={`forecast-${s.name}`} className="border-b border-amber-100/70 bg-amber-50/45 hover:bg-amber-50/70 transition-colors">
                    <td className="px-6 py-3 text-xs text-amber-700/70 font-mono whitespace-nowrap">Stimato</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 ${s.color} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-[8px] font-bold">{s.initial}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      Previsione {monthLabel}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 tabular-nums">~${s.monthly.toFixed(2)}</td>
                  </tr>
                ))}

                {unifiedPayments.length > 0 && (
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <td colSpan={3} className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Totale confermato</td>
                    <td className="px-6 py-3 font-bold text-gray-900 tabular-nums">
                      ${unifiedPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )
        })()}
      </div>

      {/* External links */}
      <div className="border-t border-gray-100 pt-6 flex gap-6">
        {[
          { label: 'Fatturazione Vercel',   href: 'https://vercel.com/account/billing' },
          { label: 'Fatturazione Supabase', href: 'https://supabase.com/dashboard/account/billing' },
        ].map(({ label, href }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            {label} <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    </div>
  )
}
