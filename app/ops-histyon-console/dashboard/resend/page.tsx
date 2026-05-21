import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { ExternalLink, ChevronRight } from 'lucide-react'
import { Suspense } from 'react'
import { MonthPicker } from '@/components/admin/MonthPicker'
import { ResendPlanSelector } from '@/components/admin/ResendPlanSelector'
import { RESEND_PLANS, RESEND_OVERAGE_RATE, type ResendPlanKey } from '@/lib/resend/plans'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Resend' }

function fmtNum(v: number): string {
  if (v >= 1_000_000) return `${v % 1_000_000 === 0 ? v / 1_000_000 : (v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${v % 1_000 === 0     ? v / 1_000     : (v / 1_000).toFixed(1)}K`
  return v.toLocaleString('it-IT')
}

async function fetchResendData() {
  const key = process.env.RESEND_API_KEY
  if (!key) return { emailsSent: null, dailyUsed: null, domains: [], apiKeyMissing: true, error: false }

  try {
    const domainsRes = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'histyon-admin/1.0' },
      next: { revalidate: 300 },
    })

    const rawMonthly = domainsRes.headers.get('x-resend-monthly-quota')
    const rawDaily   = domainsRes.headers.get('x-resend-daily-quota')

    // Header può essere "1500" oppure "1500/50000"
    const emailsSent = rawMonthly ? Number(rawMonthly.split('/')[0]) : null
    const dailyUsed  = rawDaily   ? Number(rawDaily.split('/')[0])   : null

    const domainsJson = domainsRes.ok ? await domainsRes.json() : { data: [] }

    return {
      emailsSent: emailsSent !== null && !isNaN(emailsSent) ? emailsSent : null,
      dailyUsed:  dailyUsed  !== null && !isNaN(dailyUsed)  ? dailyUsed  : null,
      domains:    (domainsJson.data ?? []) as any[],
      apiKeyMissing: false,
      error: !domainsRes.ok,
    }
  } catch {
    return { emailsSent: null, dailyUsed: null, domains: [], apiKeyMissing: false, error: true }
  }
}

export default async function AdminResendPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/ops-histyon-console/login')

  const cookieStore = await cookies()
  const planKey = (cookieStore.get('resend_plan')?.value ?? 'free') as ResendPlanKey
  const plan = RESEND_PLANS[planKey] ?? RESEND_PLANS.free

  const sp = await searchParams
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthStr = sp.month ?? currentMonth
  const isCurrentMonth = monthStr === currentMonth

  const { emailsSent, dailyUsed, domains, apiKeyMissing, error } = await fetchResendData()

  const emailsUsed    = emailsSent ?? 0
  const overageEmails = Math.max(0, emailsUsed - plan.quota)
  const overageCost   = (overageEmails / 1_000) * RESEND_OVERAGE_RATE
  const totalCost     = plan.price + overageCost

  const verifiedDomains = domains.filter((d: any) => d.status === 'verified')
  const monthLabel = new Date(monthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  function quotaBar(used: number, limit: number) {
    const pct = Math.min((used / limit) * 100, 200)
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 max-w-[120px]">
          <div
            className={`h-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-gray-800'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
          {fmtNum(used)} / {fmtNum(limit)} email
        </span>
      </div>
    )
  }

  return (
    <div className="py-10 px-8">
      {/* Header */}
      <div className="pb-8 mb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resend</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-5 h-5 bg-black flex items-center justify-center shrink-0">
              <span className="text-white text-[9px] font-black tracking-tighter">R</span>
            </div>
            <p className="text-sm text-gray-400">{plan.label} · {domains.length} {domains.length === 1 ? 'dominio' : 'domini'}</p>
          </div>
        </div>
        <a
          href="https://resend.com/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          Apri dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Month picker */}
      <Suspense>
        <MonthPicker />
      </Suspense>

      {/* Cost summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo ricorrente</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${plan.price.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Piano {plan.label} mensile</p>
        </div>
        <div className="border border-gray-200 bg-white px-8 py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Costo add-on</p>
          <p className="text-4xl font-bold tabular-nums text-gray-900">${overageCost.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">
            {overageEmails > 0
              ? `${fmtNum(overageEmails)} email overage × $${RESEND_OVERAGE_RATE}/K`
              : 'Nessun overage questo mese'}
          </p>
        </div>
      </div>

      {/* Metrics table */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">
        Dettaglio costi — {monthLabel}
        {!isCurrentMonth && <span className="ml-2 text-gray-300 font-normal normal-case">(storico)</span>}
      </h2>
      <div className="border border-gray-200 bg-white mb-8">
        <div className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Voce</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">Utilizzo</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 text-right">Costo</p>
        </div>

        {/* 1. Piano */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Piano {plan.label}</span>
            </div>
            <span className="text-xs text-gray-400 flex items-center">Costo fisso mensile</span>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">${plan.price.toFixed(2)}</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            {Object.entries(RESEND_PLANS).map(([key, p]) => (
              <p key={key} className={key === planKey ? 'font-semibold text-gray-800' : ''}>
                {p.label}: <strong>${p.price}/mese</strong> — {fmtNum(p.quota)} email
                {p.dailyLimit ? ` (max ${fmtNum(p.dailyLimit)}/giorno)` : ''}
                {key === planKey ? ' ← piano attuale' : ''}
              </p>
            ))}
            <p className="pt-1 border-t border-gray-100 mt-2">Overage su piani pagati: <strong>$0.90/1.000 email</strong></p>
          </div>
        </details>

        {/* 2. Email sending quota */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Email inviate (quota mensile)</span>
            </div>
            <div className="flex items-center">
              {apiKeyMissing
                ? <span className="text-xs text-amber-600">RESEND_API_KEY non configurata in Vercel</span>
                : error
                  ? <span className="text-xs text-amber-600">Errore chiamata API Resend — verifica la chiave</span>
                  : emailsSent === null
                    ? <span className="text-xs text-gray-300">Dato non disponibile</span>
                    : quotaBar(emailsUsed, plan.quota)
              }
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${overageCost > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {overageCost > 0 ? `$${overageCost.toFixed(2)}` : '$0.00'}
              </span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Quota piano: <strong>{fmtNum(plan.quota)} email/mese</strong></p>
            {plan.dailyLimit != null && (
              <p>Limite giornaliero: <strong>{fmtNum(plan.dailyLimit)} email/giorno</strong> (solo piano Free)</p>
            )}
            <p>Overage: <strong>$0.90/1.000 email</strong> oltre la quota (piani pagati)</p>
            {!apiKeyMissing && <p className="text-gray-400">Dato letto dall&apos;header <code>x-resend-monthly-quota</code> · cache 5 minuti</p>}
          </div>
        </details>

        {/* 3. Limite giornaliero (solo Free) */}
        {plan.dailyLimit != null && (
          <details className="group">
            <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer list-none transition-colors">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
                <span className="text-sm text-gray-800">Limite giornaliero</span>
              </div>
              <div className="flex items-center">
                {dailyUsed !== null
                  ? quotaBar(dailyUsed, plan.dailyLimit)
                  : <span className="text-xs text-gray-300">—</span>
                }
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-400">$0.00</span>
              </div>
            </summary>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-1">
              <p>Il piano Free limita a <strong>100 email/giorno</strong>. Superato il limite, le email vengono bloccate fino al giorno successivo.</p>
              <p>Passa a un piano Pro per rimuovere il limite giornaliero.</p>
            </div>
          </details>
        )}

        {/* 4. Domini */}
        <details className="group">
          <summary className="grid grid-cols-[1fr_260px_100px] gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer list-none transition-colors">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-gray-300 group-open:rotate-90 transition-transform shrink-0" />
              <span className="text-sm text-gray-800">Domini</span>
            </div>
            <div className="flex items-center">
              {apiKeyMissing
                ? <span className="text-xs text-gray-300">—</span>
                : <span className="text-[10px] font-mono text-gray-500">
                    {verifiedDomains.length} verificati / {domains.length} totali
                  </span>
              }
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">$0.00</span>
            </div>
          </summary>
          <div className="px-6 py-4 bg-gray-50 text-xs text-gray-500 space-y-2">
            {domains.length === 0
              ? <p className="text-gray-300">Nessun dominio configurato — aggiungi un dominio su resend.com/domains</p>
              : domains.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between">
                  <span className="font-mono text-gray-700">{d.name}</span>
                  <span className={`font-medium ${d.status === 'verified' ? 'text-green-600' : 'text-amber-600'}`}>
                    {d.status === 'verified' ? '✓ Verificato' : '⚠ Non verificato'}
                  </span>
                </div>
              ))
            }
          </div>
        </details>
      </div>

      {/* App data */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Riepilogo</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Email inviate (mese)',
            value: emailsSent !== null ? fmtNum(emailsSent) : '—',
          },
          {
            label: 'Quota rimanente',
            value: emailsSent !== null ? fmtNum(Math.max(0, plan.quota - emailsUsed)) : '—',
          },
          {
            label: 'Costo totale stimato',
            value: `$${totalCost.toFixed(2)}`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="border border-gray-200 bg-white px-6 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-2">{label}</p>
            <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Plan selector */}
      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-4">Piano attivo</h2>
        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-xs text-gray-500 mb-5">
            Seleziona il piano Resend attivo. La selezione viene salvata nel browser e usata per calcolare i costi in tutta la console admin.
            Non è collegata all&apos;account Resend — aggiornala quando cambi piano.
          </p>
          <ResendPlanSelector currentPlan={planKey} />

          {/* Griglia piani */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {Object.entries(RESEND_PLANS).map(([key, p]) => (
              <div
                key={key}
                className={`border px-3 py-2.5 text-xs transition-colors ${
                  key === planKey
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-100 text-gray-400'
                }`}
              >
                <p className={`font-semibold mb-0.5 ${key === planKey ? 'text-gray-900' : 'text-gray-600'}`}>
                  {p.label}
                </p>
                <p>${p.price}/mese · {fmtNum(p.quota)} email</p>
                {p.dailyLimit != null && <p className="text-gray-300">max {fmtNum(p.dailyLimit)}/giorno</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* External links */}
      <div className="border-t border-gray-100 pt-6 mt-6 flex gap-6">
        {[
          { label: 'Overview Resend',     href: 'https://resend.com/overview' },
          { label: 'Fatturazione Resend', href: 'https://resend.com/settings/billing' },
          { label: 'Domini Resend',       href: 'https://resend.com/domains' },
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
