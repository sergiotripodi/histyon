import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagamenti — Console Histyon' }

async function fetchAllCosts(monthStr: string) {
  const vercelToken = process.env.ADMIN_VERCEL_TOKEN!
  const vercelTeamId = process.env.ADMIN_VERCEL_TEAM_ID!
  const cfToken = process.env.ADMIN_CLOUDFLARE_TOKEN!
  const cfAccountId = process.env.ADMIN_CLOUDFLARE_ACCOUNT_ID!
  const sbToken = process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN!

  const [vercelTeamRes, cfSubsRes, cfHistRes, sbOrgsRes] = await Promise.all([
    fetch(`https://api.vercel.com/v1/teams/${vercelTeamId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
      next: { revalidate: 300 },
    }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/subscriptions`, {
      headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/billing/history?page=1&per_page=50`, {
      headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    }),
    fetch(`https://api.supabase.com/v1/organizations`, {
      headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    }),
  ])

  const [vercelTeam, cfSubs, cfHist, sbOrgs] = await Promise.all([
    vercelTeamRes.json(),
    cfSubsRes.json(),
    cfHistRes.json(),
    sbOrgsRes.json(),
  ])

  const vercelPlan = vercelTeam?.billing?.plan ?? 'hobby'
  const vercelMonthlyCost = vercelPlan === 'pro' ? 20 : 0

  const cfSubscriptions: any[] = cfSubs?.result ?? []
  const cfMonthlyCost = cfSubscriptions.reduce((sum: number, s: any) => sum + (s.price ?? 0), 0)
  const cfBillingHistory: any[] = cfHist?.result ?? []

  const sbOrg = Array.isArray(sbOrgs) ? sbOrgs[0] : null
  const sbPlan = sbOrg?.plan ?? 'free'
  const sbMonthlyCost = sbPlan === 'pro' ? 25 : 0

  const recurringCost = vercelMonthlyCost + sbMonthlyCost + cfMonthlyCost

  // Filter CF billing history to selected month
  const monthCfBilling = cfBillingHistory.filter((b: any) => b.occurred_at?.startsWith(monthStr))
  const addonCost = monthCfBilling.reduce((s: number, b: any) => s + (b.amount ?? 0), 0)

  // Build unified payment rows for the month from billing history
  const unifiedPayments = cfBillingHistory.map((b: any) => ({
    date: b.occurred_at ? new Date(b.occurred_at) : null,
    service: 'Cloudflare',
    description: b.description ?? '—',
    amount: b.amount ?? 0,
    id: b.id ?? String(Math.random()),
  })).sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.getTime() - a.date.getTime()
  })

  return {
    vercel: { plan: vercelPlan, monthlyCost: vercelMonthlyCost },
    supabase: { plan: sbPlan, monthlyCost: sbMonthlyCost, org: sbOrg },
    cloudflare: { subscriptions: cfSubscriptions, monthlyCost: cfMonthlyCost, billingHistory: cfBillingHistory },
    recurringCost,
    addonCost,
    unifiedPayments,
  }
}

const SERVICE_COLORS: Record<string, string> = {
  Vercel: 'bg-gray-900',
  Supabase: 'bg-[#3ECF8E]',
  Cloudflare: 'bg-[#F48120]',
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const sp = await searchParams
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthStr = sp.month ?? currentMonth
  const isCurrentMonth = monthStr === currentMonth

  const { vercel, supabase: sb, cloudflare, recurringCost, addonCost, unifiedPayments } = await fetchAllCosts(monthStr)

  const monthLabel = new Date(monthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  const services = [
    {
      name: 'Vercel',
      plan: vercel.plan === 'hobby' ? 'Hobby (Free)' : vercel.plan,
      monthly: vercel.monthlyCost,
      href: '/ops-histyon-console/dashboard/vercel',
      color: SERVICE_COLORS.Vercel,
      initial: '▲',
    },
    {
      name: 'Supabase',
      plan: sb.plan === 'free' ? 'Free' : 'Pro',
      monthly: sb.monthlyCost,
      href: '/ops-histyon-console/dashboard/supabase',
      color: SERVICE_COLORS.Supabase,
      initial: 'S',
    },
    {
      name: 'Cloudflare',
      plan: cloudflare.subscriptions.length > 0 ? 'R2 Paid' : 'Free',
      monthly: cloudflare.monthlyCost,
      href: '/ops-histyon-console/dashboard/cloudflare',
      color: SERVICE_COLORS.Cloudflare,
      initial: 'CF',
    },
  ]

  return (
    <div className="py-10 px-8">
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-gray-200 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em]">Finanze</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pagamenti e costi</h1>
          </div>
        </div>
      </div>

      {/* Month picker */}
      <Suspense>
        <MonthPicker />
      </Suspense>

      {/* Cost summary boxes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo ricorrenti</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${recurringCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Piani fissi mensili — tutti i servizi</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo add-on</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${addonCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">
            {isCurrentMonth ? 'Utilizzo oltre soglia (mese corrente)' : `Pagamenti storici — ${monthLabel}`}
          </p>
        </div>
      </div>

      {/* Per-service breakdown */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Costi per servizio</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {services.map(s => (
          <Link key={s.name} href={s.href} className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 ${s.color} flex items-center justify-center`}>
                  <span className="text-white text-[10px] font-bold">{s.initial}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{s.name}</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
                {s.plan}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">
              ${s.monthly.toFixed(2)}<span className="text-sm font-normal text-gray-400">/mese</span>
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
        {unifiedPayments.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">Nessun pagamento registrato.</p>
            <p className="text-xs text-gray-300 mt-1">I servizi attivi sono gratuiti e non generano transazioni.</p>
          </div>
        ) : (
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
              {/* Totale */}
              {unifiedPayments.length > 0 && (
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Totale</td>
                  <td className="px-6 py-3 font-bold text-gray-900 tabular-nums">
                    ${unifiedPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* External links */}
      <div className="border-t border-gray-100 pt-6 flex gap-6">
        {[
          { label: 'Fatturazione Vercel', href: 'https://vercel.com/account/billing' },
          { label: 'Fatturazione Supabase', href: 'https://supabase.com/dashboard/account/billing' },
          { label: 'Fatturazione Cloudflare', href: 'https://dash.cloudflare.com/billing' },
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
