/**
 * Vercel Billing Charges API client.
 *
 * Endpoint: GET /v1/billing/charges
 * - Disponibile solo su team Pro / Enterprise
 * - Restituisce dati in formato FOCUS v1.3 JSONL (newline-delimited JSON)
 * - Richiede ruolo Owner / Member / Developer / Security / Billing
 *
 * Ogni riga del JSONL è un BillingCharge con:
 *  - BilledCost    : prezzo di listino (PRIMA dei crediti)
 *  - EffectiveCost : prezzo effettivo (DOPO crediti / sconti)
 *  - ChargeCategory: 'Usage' | 'Adjustment' | 'Tax' | 'Purchase' | ...
 *  - ServiceName   : es. "Function Invocations", "Bandwidth", "Pro Plan"
 *  - ServiceCategory
 *  - ChargePeriodStart / ChargePeriodEnd (ISO 8601)
 *  - ConsumedQuantity / ConsumedUnit
 *
 * Doc: https://vercel.com/docs/rest-api/reference/endpoints/billing/list-focus-billing-charges
 */

export interface BillingCharge {
  BilledCost:            string
  BillingCurrency:       string
  ChargeCategory:        string
  ChargePeriodStart:     string
  ChargePeriodEnd:       string
  ConsumedQuantity:      string
  ConsumedUnit:          string
  EffectiveCost:         string
  ServiceName:           string
  ServiceCategory?:      string
  ServiceProviderName?:  string
  PricingCategory?:      string
  PricingCurrency?:      string
  PricingQuantity?:      string
  PricingUnit?:          string
  RegionId?:             string
  RegionName?:           string
  Tags?:                 string
}

export interface BillingSummary {
  /** Range richiesto */
  from:           string
  to:             string
  /** Numero righe ricevute */
  rowCount:       number
  /** Aggregato per ServiceName */
  services:       Array<{
    name:          string
    category:      string
    billedCost:    number   // somma BilledCost (lordo)
    effectiveCost: number   // somma EffectiveCost (netto post-crediti)
    quantity:      number
    unit:          string
  }>
  /** Totali */
  totalBilled:    number   // somma di tutti i BilledCost
  totalEffective: number   // somma di tutti i EffectiveCost
  /** Solo crediti (ChargeCategory == 'Adjustment' && EffectiveCost < 0) */
  creditsApplied: number   // valore positivo (es. 20.00 = "$20 di crediti")
  /** Status di ritorno */
  status:         number
  ok:             boolean
  error?:         string
}

/**
 * Fetcha /v1/billing/charges e ritorna un summary già aggregato per servizio.
 *
 * @param opts.token   Vercel API token (ADMIN_VERCEL_TOKEN)
 * @param opts.teamId  Team ID (team_xxx)
 * @param opts.fromMs  Inizio range (ms UTC)
 * @param opts.toMs    Fine range esclusiva (ms UTC)
 */
export async function fetchVercelBilling(opts: {
  token:    string
  teamId:   string
  fromMs:   number
  toMs:     number
  revalidate?: number
}): Promise<BillingSummary> {
  const { token, teamId, fromMs, toMs, revalidate = 300 } = opts

  const from = new Date(fromMs).toISOString()
  const to   = new Date(toMs).toISOString()

  const empty: BillingSummary = {
    from, to, rowCount: 0, services: [],
    totalBilled: 0, totalEffective: 0, creditsApplied: 0,
    status: 0, ok: false,
  }

  if (!token || !teamId) {
    return { ...empty, error: 'token o teamId mancante' }
  }

  let res: Response
  try {
    res = await fetch(
      `https://api.vercel.com/v1/billing/charges?teamId=${teamId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/jsonl' },
        next: { revalidate },
      },
    )
  } catch (e: any) {
    return { ...empty, error: `network: ${e?.message ?? 'unknown'}` }
  }

  const status = res.status
  if (!res.ok) {
    let body = ''
    try { body = (await res.text()).slice(0, 200) } catch {}
    return { ...empty, status, error: `HTTP ${status}: ${body}` }
  }

  const text = await res.text()
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  const charges: BillingCharge[] = []
  for (const line of lines) {
    try { charges.push(JSON.parse(line)) } catch {}
  }

  // Aggregate per ServiceName
  const map = new Map<string, BillingSummary['services'][number]>()
  let totalBilled = 0, totalEffective = 0, creditsApplied = 0

  for (const c of charges) {
    const billed    = Number(c.BilledCost) || 0
    const effective = Number(c.EffectiveCost) || 0
    const qty       = Number(c.ConsumedQuantity) || 0

    totalBilled    += billed
    totalEffective += effective

    // Adjustment con EffectiveCost negativo = credito applicato
    if (c.ChargeCategory === 'Adjustment' && effective < 0) {
      creditsApplied += Math.abs(effective)
    }

    const key = c.ServiceName || 'Unknown'
    const existing = map.get(key)
    if (existing) {
      existing.billedCost    += billed
      existing.effectiveCost += effective
      existing.quantity      += qty
    } else {
      map.set(key, {
        name:          key,
        category:      c.ServiceCategory ?? '',
        billedCost:    billed,
        effectiveCost: effective,
        quantity:      qty,
        unit:          c.ConsumedUnit ?? '',
      })
    }
  }

  return {
    from, to,
    rowCount:       charges.length,
    services:       Array.from(map.values()).sort((a, b) => b.billedCost - a.billedCost),
    totalBilled,
    totalEffective,
    creditsApplied,
    status,
    ok:             true,
  }
}
