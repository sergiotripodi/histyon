import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink, Globe } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cloudflare — Console Histyon' }

async function fetchCloudflareData() {
  const token = process.env.ADMIN_CLOUDFLARE_TOKEN!
  const accountId = process.env.ADMIN_CLOUDFLARE_ACCOUNT_ID!
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const [accountRes, subsRes, zonesRes, billingRes] = await Promise.all([
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/subscriptions`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/zones?account.id=${accountId}`, { headers, next: { revalidate: 300 } }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/billing/profile`, { headers, next: { revalidate: 300 } }),
  ])

  const [account, subs, zones, billing] = await Promise.all([
    accountRes.json(),
    subsRes.json(),
    zonesRes.json(),
    billingRes.json(),
  ])

  return {
    account: account?.result ?? null,
    subscriptions: subs?.result ?? [],
    zones: zones?.result ?? [],
    billing: billing?.result ?? null,
  }
}

function planFromSubs(subs: any[]): string {
  if (!subs.length) return 'Free'
  const names = subs.map((s: any) => s.rate_plan?.public_name ?? '').filter(Boolean)
  return names.join(', ')
}

function monthlyCostFromSubs(subs: any[]): number {
  return subs.reduce((sum: number, s: any) => {
    const price = s.price ?? 0
    return sum + price
  }, 0)
}

export default async function AdminCloudflarePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const { account, subscriptions, zones, billing } = await fetchCloudflareData()

  const planLabel = planFromSubs(subscriptions)
  const monthlyCost = monthlyCostFromSubs(subscriptions)
  const hasZones = zones.length > 0

  // R2 subscription details
  const r2Sub = subscriptions.find((s: any) => s.rate_plan?.id?.includes('r2'))
  const r2Components: any[] = r2Sub?.component_values ?? []

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
            <div className="w-8 h-8 bg-[#F48120] flex items-center justify-center">
              <span className="text-white text-sm font-bold">CF</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cloudflare</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest border border-gray-200 px-3 py-2 text-gray-600">
            {planLabel || 'Standard'}
          </span>
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Apri dashboard <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>


      {/* Account info */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Account</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Nome account', value: account?.name ?? '—' },
          { label: 'Tipo account', value: account?.type ?? 'standard' },
          { label: 'Creato il', value: account?.created_on ? new Date(account.created_on).toLocaleDateString('it-IT') : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 bg-white px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-1.5">{label}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Billing */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Abbonamento e costi</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Piani attivi</p>
          <p className="text-lg font-bold text-gray-900">{planLabel || 'Nessun piano a pagamento'}</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Costo mensile stimato</p>
          <p className="text-xl font-bold text-gray-900">${monthlyCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Basato sulle sottoscrizioni attive</p>
        </div>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">Email fatturazione</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{billing?.billing_email ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{billing?.country ?? '—'}</p>
        </div>
      </div>

      {/* Subscriptions detail */}
      {subscriptions.length > 0 && (
        <>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
            Sottoscrizioni attive ({subscriptions.length})
          </h2>
          <div className="space-y-3 mb-8">
            {subscriptions.map((s: any) => (
              <div key={s.id} className="border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{s.rate_plan?.public_name ?? s.rate_plan?.id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Scope: {s.rate_plan?.scope ?? 'account'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${(s.price ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">/mese</p>
                  </div>
                </div>
                {/* Component values */}
                {s.component_values?.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2">
                    {s.component_values.map((c: any) => (
                      <div key={c.name} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{c.display_name ?? c.name}</span>
                        <span className="font-mono text-gray-700">
                          {c.value?.toLocaleString('it-IT')} {c.unit ?? ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* R2 Storage info */}
      {r2Sub && (
        <>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
            Cloudflare R2 Storage
          </h2>
          <div className="border border-gray-200 bg-white p-6 mb-8">
            <p className="text-sm text-gray-600 mb-4">
              R2 è il servizio di object storage di Cloudflare, compatibile con S3. Histyon usa R2 per conservare le immagini delle analisi mediche. Il piano è a pagamento (pay-as-you-go).
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Soglia gratuita storage', value: '10 GB/mese' },
                { label: 'Costo oltre soglia', value: '$0.015/GB/mese' },
                { label: 'Operazioni classe A (write)', value: '$4.50 / milione' },
                { label: 'Operazioni classe B (read)', value: '$0.36 / milione' },
                { label: 'Egress verso internet', value: 'Gratuito' },
                { label: 'Egress verso altri CF', value: 'Gratuito' },
              ].map(({ label, value }) => (
                <div key={label} className="border border-gray-100 px-4 py-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400">
              I dati di utilizzo R2 dettagliati (storage effettivo, operazioni) sono disponibili nella dashboard Cloudflare. Le API analytics R2 richiedono permessi aggiuntivi.
            </p>
          </div>
        </>
      )}

      {/* Zones */}
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
