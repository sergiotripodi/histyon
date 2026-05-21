import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'
import { RESEND_PLANS, type ResendPlanKey } from '@/lib/resend/plans'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagamenti' }

async function fetchServicePlans() {
  const vercelToken = process.env.ADMIN_VERCEL_TOKEN
  const vercelTeamId = process.env.ADMIN_VERCEL_TEAM_ID
  const sbToken = process.env.ADMIN_SUPABASE_MANAGEMENT_TOKEN

  const [vercelRes, sbOrgsRes] = await Promise.all([
    vercelToken && vercelTeamId
      ? fetch(`https://api.vercel.com/v1/teams/${vercelTeamId}`, {
          headers: { Authorization: `Bearer ${vercelToken}` },
          next: { revalidate: 300 },
        }).catch(() => null)
      : Promise.resolve(null),
    sbToken
      ? fetch('https://api.supabase.com/v1/organizations', {
          headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
          next: { revalidate: 300 },
        }).catch(() => null)
      : Promise.resolve(null),
  ])

  const [vercelJson, sbOrgsJson] = await Promise.all([
    vercelRes?.ok ? vercelRes.json().catch(() => null) : Promise.resolve(null),
    sbOrgsRes?.ok ? sbOrgsRes.json().catch(() => null) : Promise.resolve(null),
  ])

  const vercelPlan: string = vercelJson?.billing?.plan ?? 'hobby'
  const sbOrg = Array.isArray(sbOrgsJson) ? sbOrgsJson[0] : null
  const sbPlan: string = sbOrg?.plan ?? 'free'

  return { vercelPlan, sbPlan }
}

// Genera storico fatture sintetico (12 mesi basati sul piano attuale)
function buildInvoiceHistory(
  vercelPlan: string,
  sbPlan: string,
  selectedMonth: string,
): { service: string; description: string; amount: number; status: 'Pagato' | 'Gratuito' | 'In corso' }[] {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const isCurrentMonth = selectedMonth === currentMonth
  const isPast = selectedMonth < currentMonth

  if (!isPast && !isCurrentMonth) return []

  const status = isCurrentMonth ? 'In corso' : undefined

  const rows: { service: string; description: string; amount: number; status: 'Pagato' | 'Gratuito' | 'In corso' }[] = []

  // Vercel
  const vercelCost = vercelPlan === 'pro' ? 20 : 0
  rows.push({
    service: 'Vercel',
    description: vercelPlan === 'pro' ? 'Vercel Pro — abbonamento mensile' : 'Vercel Hobby — piano gratuito',
    amount: vercelCost,
    status: status ?? (vercelCost > 0 ? 'Pagato' : 'Gratuito'),
  })

  // Supabase (sempre presente, anche a $0)
  const sbCost = sbPlan === 'pro' ? 25 : 0
  rows.push({
    service: 'Supabase',
    description: sbPlan === 'pro' ? 'Supabase Pro — abbonamento mensile' : 'Supabase Free — piano gratuito',
    amount: sbCost,
    status: status ?? (sbCost > 0 ? 'Pagato' : 'Gratuito'),
  })

  return rows
}

const SERVICE_COLORS: Record<string, string> = {
  Vercel: 'bg-gray-900',
  Supabase: 'bg-[#3ECF8E]',
  Resend: 'bg-black',
}

function ServiceIcon({ name }: { name: string }) {
  if (name === 'Vercel') {
    return (
      <div className="w-5 h-5 bg-gray-900 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 116 100" fill="white" className="w-2.5 h-2.5">
          <path d="M57.5 15L100 85H15L57.5 15Z" />
        </svg>
      </div>
    )
  }
  if (name === 'Supabase') {
    return (
      <div className="w-5 h-5 bg-[#3ECF8E] flex items-center justify-center shrink-0">
        <svg viewBox="0 0 109 113" fill="none" className="w-2.5 h-2.5">
          <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="white" />
          <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="white" fillOpacity="0.7" />
        </svg>
      </div>
    )
  }
  if (name === 'Resend') {
    return (
      <div className="w-5 h-5 bg-black flex items-center justify-center shrink-0">
        <span className="text-white text-[8px] font-black tracking-tighter">R</span>
      </div>
    )
  }
  return (
    <div className="w-5 h-5 bg-gray-400 flex items-center justify-center shrink-0">
      <span className="text-white text-[8px] font-bold">{name[0]}</span>
    </div>
  )
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const sp = await searchParams
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthStr = sp.month ?? currentMonth
  const isCurrentMonth = monthStr === currentMonth

  const cookieStore = await cookies()
  const resendPlanKey = (cookieStore.get('resend_plan')?.value ?? 'free') as ResendPlanKey
  const resendPlan = RESEND_PLANS[resendPlanKey] ?? RESEND_PLANS.free

  const { vercelPlan, sbPlan } = await fetchServicePlans()

  const vercelMonthlyCost = vercelPlan === 'pro' ? 20 : 0
  const sbMonthlyCost = sbPlan === 'pro' ? 25 : 0
  const resendMonthlyCost = resendPlan.price

  const recurringCost = vercelMonthlyCost + sbMonthlyCost + resendMonthlyCost
  // Nessun add-on tracciato per ora
  const totalAddon = 0

  const monthLabel = new Date(monthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const monthLabelCapitalized = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const invoiceRows = buildInvoiceHistory(vercelPlan, sbPlan, monthStr)
  const invoiceTotal = invoiceRows.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">
          Fatturazione
        </p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pagamenti e costi</h1>
      </div>

      {/* Month picker */}
      <Suspense>
        <MonthPicker />
      </Suspense>

      {/* Cost summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Spese fisse / mese</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${recurringCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Vercel + Supabase + Resend</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Spese aggiuntive</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${totalAddon.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Overage, domini, add-on</p>
        </div>
      </div>

      {/* Per-service breakdown */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Costi per servizio</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">

        {/* Vercel */}
        <Link href="/ops-histyon-console/dashboard/vercel" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gray-900 flex items-center justify-center">
                <svg viewBox="0 0 116 100" fill="white" className="w-3.5 h-3.5">
                  <path d="M57.5 15L100 85H15L57.5 15Z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">Vercel</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              {vercelPlan}
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">${vercelMonthlyCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            Vedi dettaglio <ExternalLink className="w-3 h-3" />
          </p>
        </Link>

        {/* Supabase */}
        <Link href="/ops-histyon-console/dashboard/supabase" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#3ECF8E] flex items-center justify-center">
                <svg viewBox="0 0 109 113" fill="none" className="w-3.5 h-3.5">
                  <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="white" />
                  <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="white" fillOpacity="0.7" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">Supabase</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              {sbPlan}
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">${sbMonthlyCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            Vedi dettaglio <ExternalLink className="w-3 h-3" />
          </p>
        </Link>

        {/* Resend */}
        <Link href="/ops-histyon-console/dashboard/resend" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-black flex items-center justify-center">
                <span className="text-white text-[10px] font-black tracking-tighter">R</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Resend</span>
            </div>
            <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">
              {resendPlanKey.replace('_', ' ')}
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">${resendMonthlyCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            Vedi dettaglio <ExternalLink className="w-3 h-3" />
          </p>
        </Link>

      </div>

      {/* Invoice history */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Fatture — {monthLabelCapitalized}
        {isCurrentMonth && (
          <span className="ml-2 text-amber-500 font-medium normal-case text-[10px]">mese in corso</span>
        )}
      </h2>
      <div className="border border-gray-200 bg-white mb-4">
        {invoiceRows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">Nessuna fattura per il periodo selezionato.</p>
            <p className="text-xs text-gray-300 mt-1">Seleziona un mese passato o il mese corrente.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Servizio', 'Descrizione', 'Importo', 'Stato'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <ServiceIcon name={row.service} />
                      <span className="text-xs font-medium text-gray-700">{row.service}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-600">{row.description}</td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900 tabular-nums">
                    ${row.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      row.status === 'Pagato'   ? 'bg-green-50 text-green-700' :
                      row.status === 'Gratuito' ? 'bg-gray-50 text-gray-500' :
                                                  'bg-amber-50 text-amber-700'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {invoiceRows.length > 0 && (
                <tr className="bg-gray-50 border-t border-gray-100">
                  <td colSpan={2} className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Totale {monthLabelCapitalized}
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-900 tabular-nums text-sm">
                    ${invoiceTotal.toFixed(2)}
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Resend note */}
      <p className="text-[11px] text-gray-400 mb-8 flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 inline-flex items-center justify-center bg-black text-white text-[8px] font-black shrink-0">R</span>
        Resend non è integrato nella fatturazione Vercel — è fatturato separatamente su{' '}
        <a href="https://resend.com/settings/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 transition-colors">
          resend.com
        </a>
        .
      </p>

      {/* External links */}
      <div className="border-t border-gray-100 pt-6 flex gap-6 flex-wrap">
        {[
          { label: 'Fatturazione Vercel',   href: 'https://vercel.com/account/billing' },
          { label: 'Fatturazione Supabase', href: 'https://supabase.com/dashboard/account/billing' },
          { label: 'Fatturazione Resend',   href: 'https://resend.com/settings/billing' },
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
