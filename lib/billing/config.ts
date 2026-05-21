/**
 * Configurazione fatturazione Histyon.
 *
 * BILLING_DAY  → giorno del mese in cui si chiude il ciclo.
 *                Aggiorna QUI e basta: la dashboard, il cron e lo snapshot
 *                lo leggono tutti da questo file.
 *
 * PROJECT_START → mese di avvio (formato 'YYYY-MM').
 *                 Usato per il calcolo del totale storico e il grafico.
 */

export const BILLING_DAY   = 30          // giorno di chiusura ciclo
export const PROJECT_START = '2026-05'   // mese di avvio del progetto

// ── Supabase Pro overage pricing ─────────────────────────────────────────────
// Fonte: https://supabase.com/pricing
export const SB_INCLUDED_DB_GiB      = 8       // GB inclusi nel Pro
export const SB_INCLUDED_STORAGE_GiB = 100     // GB storage inclusi
export const SB_INCLUDED_EGRESS_GiB  = 250     // GB egress inclusi

export const SB_OVERAGE_DB_PER_GiB      = 0.125  // $/GB database
export const SB_OVERAGE_STORAGE_PER_GiB = 0.021  // $/GB storage
export const SB_OVERAGE_EGRESS_PER_GiB  = 0.09   // $/GB egress
