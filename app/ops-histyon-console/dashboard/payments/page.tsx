import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TimeChart } from '@/components/admin/TimeChart'
import { ArrowLeft, ExternalLink, CreditCard } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagamenti — Console Histyon' }

async function fetchAllCosts() {
  const vercelToken = process.env.ADMIN_VERCEL_TOKEN!
  const vercelTeamId = process.env.ADMIN_VERCEL_TEAM_ID!
  const cfToken = process.env.ADMIN_CLOUDFLARE_TOKEN!
  const cfAccountId = process.env.ADMIN_CLOUDFLARE_ACCOUNT_ID!

  const [vercelTeamRes, cfSubsRes] = await Promise.all([
    fetch(`https://api.vercel.com/v1/teams/${vercelTeamId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
      next: { revalidate: 300 },
    }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/subscriptions`, {
      headers: { Authorization: `Bearer ${cfToken}` },
      next: { revalidate: 300 },
    }),
  ])

  const [vercelTeam, cfSubs] = await Promise.all([vercelTeamRes.json(), cfSubsRes.json()])

  const vercelPlan = vercelTeam?.billing?.plan ?? 'hobby'
  const vercelMonthlyCost = vercelPlan === 'pro' ? 20 : vercelPlan === 'enterprise' ? 0 : 0
  const vercelNextBilling = vercelTeam?.billing?.period?.end ?? null

  const cfSubscriptions: any[] = cfSubs?.result ?? []
  const cfMonthlyCost = cfSubscriptions.reduce((sum: number, s: any) => sum + (s.price ?? 0), 0)

  // Supabase Free = $0
  const supabaseMonthlyCost = 0

  return {
    vercel: { plan: vercelPlan, monthlyCost: vercelMonthlyCost, nextBilling: vercelNextBilling },
    supabase: { plan: 'free', monthlyCost: supabaseMonthlyCost },
    cloudflare: { subscriptions: cfSubscriptions, monthlyCost: cfMonthlyCost },
    totalMonthly: vercelMonthlyCost + supabaseMonthlyCost + cfMonthlyCost,
  }
}

// Generate last 12 months for cost chart
function getLast12Months(): { key: string; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (11 - i))
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
    }
  })
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const costs = await fetchAllCosts()

  const months = getLast12Months()

  // Cost chart: fixed monthly costs (simplified — real billing history requires Stripe/provider API)
  const costChartData = months.map(m => ({
    label: m.label,
    value: costs.totalMonthly,
  }))

  // Upcoming payments list
  const upcomingPayments = [
    costs.vercel.plan === 'pro' && {
      service: 'Vercel',
      label: 'Piano Pro mensile',
      amount: costs.vercel.monthlyCost,
      date: costs.vercel.nextBilling
        ? new Date(costs.vercel.nextBilling * 1000).toLocaleDateString('it-IT')
        : 'Fine del mese corrente',
      color: 'bg-gray-900',
    },
    costs.cloudflare.subscriptions.length > 0 && {
      service: 'Cloudflare R2',
      label: 'R2 Paid (pay-as-you-go)',
      amount: costs.cloudflare.monthlyCost,
      date: 'Fine del mese corrente',
      color: 'bg-[#F48120]',
    },
  ].filter(Boolean) as { service: string; label: string; amount: number; date: string; color: string }[]

  const services = [
    {
      name: 'Vercel',
      plan: costs.vercel.plan,
      monthly: costs.vercel.monthlyCost,
      annual: costs.vercel.monthlyCost * 12,
      usageBased: false,
      href: '/ops-histyon-console/dashboard/vercel',
      color: 'bg-gray-900',
      initial: '▲',
    },
    {
      name: 'Supabase',
      plan: costs.supabase.plan,
      monthly: costs.supabase.monthlyCost,
      annual: 0,
      usageBased: false,
      href: '/ops-histyon-console/dashboard/supabase',
      color: 'bg-[#3ECF8E]',
      initial: 'S',
    },
    {
      name: 'Cloudflare',
      plan: costs.cloudflare.subscriptions.length > 0 ? 'R2 Paid' : 'Free',
      monthly: costs.cloudflare.monthlyCost,
      annual: costs.cloudflare.monthlyCost * 12,
      usageBased: true,
      href: '/ops-histyon-console/dashboard/cloudflare',
      color: 'bg-[#F48120]',
      initial: 'CF',
    },
  ]

  return (
    <div className="py-10 px-8">
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">Finanze</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-gray-200 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pagamenti e costi</h1>
          </div>
        </div>
      </div>

      {/* Total cost summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Costo mensile totale</p>
          <p className="text-3xl font-bold tabular-nums text-gray-900">${costs.totalMonthly.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Tutti i servizi inclusi</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Costo annuale stimato</p>
          <p className="text-3xl font-bold tabular-nums text-gray-900">${(costs.totalMonthly * 12).toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Proiezione a 12 mesi</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Servizi attivi a pagamento</p>
          <p className="text-3xl font-bold tabular-nums text-gray-900">
            {services.filter(s => s.monthly > 0).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">su {services.length} servizi totali</p>
        </div>
      </div>

      {/* Cost chart */}
      <div className="border border-gray-200 bg-white p-6 mb-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-6">
          Andamento costi mensili — ultimi 12 mesi
        </p>
        <TimeChart
          data={costChartData}
          height={140}
          format="currency"
        />
        <p className="mt-3 text-[10px] text-gray-300">
          Il grafico mostra i costi fissi mensili. I costi variabili per usage appariranno quando saranno disponibili le API di billing dettagliate dei provider.
        </p>
      </div>

      {/* Per-service breakdown */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Costi per servizio
      </h2>
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
            <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">${s.monthly.toFixed(2)}<span className="text-sm font-normal text-gray-400">/mese</span></p>
            <p className="text-xs text-gray-400">
              {s.usageBased ? 'Base + costi variabili per utilizzo' : s.monthly === 0 ? 'Gratuito' : `$${s.annual.toFixed(2)}/anno stimato`}
            </p>
          </Link>
        ))}
      </div>

      {/* Upcoming payments */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Prossimi pagamenti
      </h2>
      {upcomingPayments.length === 0 ? (
        <div className="border border-gray-200 bg-white px-6 py-8 text-center">
          <p className="text-sm text-gray-400">Nessun pagamento pianificato — tutti i servizi attivi sono gratuiti.</p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Servizio', 'Descrizione', 'Importo', 'Data prevista'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcomingPayments.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 ${p.color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-[8px] font-bold">{p.service[0]}</span>
                      </div>
                      <span className="font-medium text-gray-900">{p.service}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{p.label}</td>
                  <td className="px-6 py-3 font-bold text-gray-900 tabular-nums">${p.amount.toFixed(2)}</td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{p.date}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Totale</td>
                <td className="px-6 py-3 font-bold text-gray-900 tabular-nums">
                  ${upcomingPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)}
                </td>
                <td className="px-6 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Provider links */}
      <div className="mt-8 border-t border-gray-100 pt-6 flex gap-6">
        {[
          { label: 'Gestisci fatturazione Vercel', href: 'https://vercel.com/account/billing' },
          { label: 'Gestisci fatturazione Supabase', href: 'https://supabase.com/dashboard/account/billing' },
          { label: 'Gestisci fatturazione Cloudflare', href: 'https://dash.cloudflare.com/billing' },
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
