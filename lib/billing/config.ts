/**
 * Configurazione fatturazione Histyon — UNICO punto di verità.
 *
 * BILLING_DAY  → giorno in cui inizia/si rinnova il ciclo di fatturazione
 *                (es. 24 = ciclo 24 mag → 23 giu → reset 24 giu)
 * PROJECT_START → mese di avvio del progetto (YYYY-MM)
 *
 * I prezzi/limiti per le soglie di overage sono usati SOLO come fallback
 * quando l'API del servizio non restituisce il dato; la fonte primaria
 * sono sempre le risposte live di Vercel/Supabase/Resend.
 */

export const BILLING_DAY   = 24          // giorno di inizio/rinnovo ciclo
export const PROJECT_START = '2026-05'   // mese di avvio del progetto

// ── Supabase — prezzi overage (fallback se API non restituisce il limite) ─────
export const SB_OVERAGE_DB_PER_GiB      = 0.125  // $/GB database oltre soglia
export const SB_OVERAGE_STORAGE_PER_GiB = 0.021  // $/GB storage oltre soglia
export const SB_OVERAGE_EGRESS_PER_GiB  = 0.09   // $/GB egress oltre soglia

// Limiti inclusi nel piano (fallback se API non li espone)
export const SB_FALLBACK: Record<string, { free: number; pro: number }> = {
  db_size:  { free: 500 * 1024 ** 2, pro: 8  * 1024 ** 3 },   // 500 MB / 8 GB
  storage:  { free: 1   * 1024 ** 3, pro: 100 * 1024 ** 3 },   // 1 GB / 100 GB
  egress:   { free: 5   * 1024 ** 3, pro: 250 * 1024 ** 3 },   // 5 GB / 250 GB
  mau:      { free: 50_000,          pro: 50_000 },
}

/**
 * Calcola il range del periodo di fatturazione.
 *
 * Se si passa monthStr (es. '2026-05') restituisce il ciclo di quel mese:
 *   startMs = 24 mag 00:00 UTC
 *   endMs   = 24 giu 00:00 UTC  (escluso, usare < endMs)
 *
 * Senza argomento calcola il ciclo corrente basandosi sulla data UTC di oggi.
 */
export function getBillingPeriodMs(monthStr?: string): { startMs: number; endMs: number } {
  let y: number, m: number   // m è 0-indexed

  if (monthStr) {
    const [py, pm] = monthStr.split('-').map(Number)
    y = py
    m = pm - 1
  } else {
    const now = new Date()
    y = now.getUTCFullYear()
    m = now.getUTCMonth()
    if (now.getUTCDate() < BILLING_DAY) {
      m--
      if (m < 0) { m = 11; y-- }
    }
  }

  const startMs = Date.UTC(y, m, BILLING_DAY)
  let endY = y, endM = m + 1
  if (endM > 11) { endM = 0; endY++ }
  const endMs = Date.UTC(endY, endM, BILLING_DAY)   // esclusivo

  return { startMs, endMs }
}
