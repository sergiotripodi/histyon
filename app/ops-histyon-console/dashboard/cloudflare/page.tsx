import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink, Globe, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cloudflare — Console Histyon' }

async function fetchCloudflareData() {
  const token = process.env.ADMIN_CLOUDFLARE_TOKEN!
  const accountId = process.env.ADMIN_CLOUDFLARE_ACCOUNT_ID!
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const [accountRes, subsRes, zonesRes, billingRes, billingHistRes] = await Promise.all([
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/subscriptions`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/zones?account.id=${accountId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/billing/profile`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/billing/history?page=1&per_page=20`, { headers, next: { revalidate: 300 } }),
  ])

  const [account, subs, zones, billing, billingHist] = await Promise.all([
    accountRes.json(),
    subsRes.json(),
    zonesRes.json(),
    billingRes.json(),
    billingHistRes.json(),
  ])

  return {
    account: account?.result ?? null,
    subscriptions: subs?.result ?? [],
    zones: zones?.result ?? [],
    billing: billing?.result ?? null,
    billingHistory: billingHist?.result ?? [],
  }
}

function monthlyCostFromSubs(subs: any[]): number {
  return subs.reduce((sum: number, s: any) => sum + (s.price ?? 0), 0)
}

const r2PricingRows = [
  { tier: 'Storage', price: '$0.015/GB/mese oltre 10GB' },
  { tier: 'Operazioni classe A (write)', price: '$4.50/milione' },
  { tier: 'Operazioni classe B (read)', price: '$0.36/milione' },
  { tier: 'Egress', price: 'Gratuito' },
]

export default async function AdminCloudflarePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const { account, subscriptions, zones, billingHistory } = await fetchCloudflareData()

  const monthlyCost = monthlyCostFromSubs(subscriptions)
  const hasZones = zones.length > 0

  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('it-IT')
  const hasPaidSubs = subscriptions.length > 0 || billingHistory.length > 0

  const details = [
    { label: 'Nome account', value: account?.name ?? '—' },
    { label: 'Creato il', value: account?.created_on ? new Date(account.created_on).toLocaleDateString('it-IT') : 'Dato non disponibile' },
    { label: 'Regione', value: 'Dato non disponibile' },
    { label: 'Piano', value: account?.type ?? 'Dato non disponibile' },
    { label: 'Stato', value: '● Attivo', green: true },
    { label: 'Versione', value: 'Dato non disponibile' },
  ]

  return (
    <div className="py-10 px-8">
      <Link href="/ops-histyon-console/dashboard" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F48120] flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">CF</span>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em]">Cloudflare</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{account?.name ?? 'histyon'}</h1>
          </div>
        </div>
        <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer"
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
          <p className="text-4xl font-bold tabular-nums text-gray-900">${monthlyCost.toFixed(2)}</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Prossimo pagamento</p>
          {hasPaidSubs ? (
            <>
              <p className="text-4xl font-bold tabular-nums text-gray-900">${monthlyCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-2">{endOfMonth}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Nessun pagamento pianificato</p>
          )}
        </div>
      </div>

      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Composizione costo</h2>
      <div className="border border-gray-200 bg-white mb-8 divide-y divide-gray-100">
        {subscriptions.length > 0 ? subscriptions.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-gray-700">{s.rate_plan?.public_name ?? s.rate_plan?.id ?? 'Sottoscrizione'}</span>
            <span className="text-sm font-bold text-gray-900">${(s.price ?? 0).toFixed(2)}</span>
          </div>
        )) : (
          <div className="px-6 py-4">
            <p className="text-xs text-gray-400">Nessuna sottoscrizione fissa. R2 è fatturato in base all&apos;utilizzo oltre le soglie gratuite.</p>
          </div>
        )}
      </div>

      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Listino prezzi R2</h2>
      <div className="border border-gray-200 bg-white mb-8">
        <table className="w-full text-sm">
          <tbody>
            {r2PricingRows.map(({ tier, price }) => (
              <tr key={tier} className="border-b border-gray-50 last:border-0">
                <td className="px-6 py-3 text-gray-600">{tier}</td>
                <td className="px-6 py-3 text-right font-mono text-gray-900">{price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {billingHistory.length > 0 && (
        <>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Storico pagamenti</h2>
          <div className="border border-gray-200 bg-white mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Data', 'Descrizione', 'Importo', 'Valuta'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((b: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">
                      {b.occurred_at ? new Date(b.occurred_at).toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{b.description ?? '—'}</td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 tabular-nums">
                      {b.amount != null ? `$${Number(b.amount).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400">{b.currency ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hasZones && (
        <>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
            Zone ({zones.length})
          </h2>
          <div className="border border-gray-200 bg-white mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Dominio', 'Piano', 'Stato', 'Zone ID'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((z: any) => (
                  <tr key={z.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-900">{z.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">{z.plan?.name ?? '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium ${z.status === 'active' ? 'text-green-600' : 'text-amber-500'}`}>
                        ● {z.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs font-mono text-gray-400">{z.id}</td>
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
