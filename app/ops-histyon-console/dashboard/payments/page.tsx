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

// Giorno del mese in cui si chiude il ciclo di fatturazione.
// Il 30 tutti i costi del mese corrente passano al mese precedente
// e si apre un nuovo ciclo a $0 per le spese variabili.
const BILLING_DAY = 30

// Mese di avvio del progetto — aggiornare quando si conosce la data esatta.
const PROJECT_START = '2026-05'

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

/**
 * Calcola il totale storico sommando tutti i mesi dall'avvio del progetto
 * fino a oggi (incluso il mese corrente), usando il piano attuale come base.
 * Il ciclo si chiude il giorno BILLING_DAY: se siamo oltre, il mese corrente
 * è già "chiuso" e conta nel totale; se no, conta come mese parziale incluso.
 */
function computeHistoricalTotal(recurringCost: number): number {
  const start = new Date(PROJECT_START + '-01')
  const now = new Date()

  // Quanti mesi completi dall'avvio (incluso il mese di avvio = 1)
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    1 // il mese corrente conta sempre

  return Math.max(1, monthsElapsed) * recurringCost
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const sp = await searchParams
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const monthStr = sp.month ?? currentMonth
  const isCurrentMonth = monthStr === currentMonth
  const isFuture = monthStr > currentMonth

  // Ciclo di fatturazione: dopo il giorno BILLING_DAY si è nel mese nuovo
  const isBillingDay = now.getDate() >= BILLING_DAY && isCurrentMonth

  const cookieStore = await cookies()
  const resendPlanKey = (cookieStore.get('resend_plan')?.value ?? 'free') as ResendPlanKey
  const resendPlan = RESEND_PLANS[resendPlanKey] ?? RESEND_PLANS.free

  const { vercelPlan, sbPlan } = await fetchServicePlans()

  const vercelMonthlyCost = vercelPlan === 'pro' ? 20 : 0
  const sbMonthlyCost = sbPlan === 'pro' ? 25 : 0
  const resendMonthlyCost = resendPlan.price

  const recurringCost = vercelMonthlyCost + sbMonthlyCost + resendMonthlyCost
  const totalAddon = 0

  // Box 3: somma di tutti i mesi dall'avvio
  const historicalTotal = computeHistoricalTotal(recurringCost)

  const monthLabel = new Date(monthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.14em] mb-2">Fatturazione</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pagamenti e costi</h1>
      </div>

      {/* Month picker */}
      <Suspense>
        <MonthPicker />
      </Suspense>

      {/* 3 cost boxes */}
      {isFuture ? (
        <div className="border border-gray-200 bg-white px-8 py-10 text-center mb-8">
          <p className="text-sm text-gray-400">Nessun dato per mesi futuri.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Box 1: Spese fisse */}
          <div className="border border-gray-200 bg-white px-8 py-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
              Spese fisse — {monthLabelCap}
            </p>
            <p className="text-4xl font-bold tabular-nums text-gray-900">${recurringCost.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-2">Piano mensile Vercel + Supabase + Resend</p>
            {isBillingDay && isCurrentMonth && (
              <p className="text-[10px] text-amber-600 font-medium mt-2 uppercase tracking-wide">Ciclo in chiusura oggi</p>
            )}
          </div>

          {/* Box 2: Spese aggiuntive */}
          <div className="border border-gray-200 bg-white px-8 py-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
              Spese aggiuntive — {monthLabelCap}
            </p>
            <p className="text-4xl font-bold tabular-nums text-gray-900">${totalAddon.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-2">Overage, domini, add-on uso eccedente</p>
          </div>

          {/* Box 3: Totale storico */}
          <div className="border border-gray-900 bg-gray-900 px-8 py-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">
              Totale storico Histyon
            </p>
            <p className="text-4xl font-bold tabular-nums text-white">${historicalTotal.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Spesa cumulata dall&apos;avvio del progetto</p>
          </div>
        </div>
      )}

      {/* Service cards — visibili sempre (non solo mese corrente) */}
      {!isFuture && (
        <>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Costi per servizio</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">

            <Link href="/ops-histyon-console/dashboard/vercel" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gray-900 flex items-center justify-center">
                    <svg viewBox="0 0 116 100" fill="white" className="w-3.5 h-3.5"><path d="M57.5 15L100 85H15L57.5 15Z" /></svg>
                  </div>
                  <span className="text-sm font-bold text-gray-900">Vercel</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">{vercelPlan}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">${vercelMonthlyCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">Vedi dettaglio <ExternalLink className="w-3 h-3" /></p>
            </Link>

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
                <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">{sbPlan}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">${sbMonthlyCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">Vedi dettaglio <ExternalLink className="w-3 h-3" /></p>
            </Link>

            <Link href="/ops-histyon-console/dashboard/resend" className="block group border border-gray-200 bg-white p-6 hover:border-gray-400 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-black flex items-center justify-center">
                    <span className="text-white text-[10px] font-black tracking-tighter">R</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">Resend</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-gray-400 border border-gray-100 px-2 py-0.5">{resendPlanKey.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-gray-900 mb-1">${resendMonthlyCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">Vedi dettaglio <ExternalLink className="w-3 h-3" /></p>
            </Link>

          </div>
        </>
      )}

      {/* Nota ciclo di fatturazione */}
      <p className="text-[11px] text-gray-400 mb-8">
        Il ciclo di fatturazione si azzera il giorno <strong className="text-gray-600">{BILLING_DAY}</strong> di ogni mese.
        Quando arriverà quel giorno potrai impostare il giorno esatto di fatturazione Vercel + Supabase.
      </p>

      {/* External links */}
      <div className="border-t border-gray-100 pt-6 flex gap-6 flex-wrap">
        {[
          { label: 'Fatturazione Vercel',   href: 'https://vercel.com/account/billing' },
          { label: 'Fatturazione Supabase', href: 'https://supabase.com/dashboard/account/billing' },
          { label: 'Fatturazione Resend',   href: 'https://resend.com/settings/billing' },
        ].map(({ label, href }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            {label} <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    </div>
  )
}
