import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EgressStats {
  tileBytes:          number  // egress viewer DZI (proxy → Supabase CDN)
  tileRequests:       number  // numero tile servite
  inputDownloadBytes: number  // egress AI che scarica il file originale
  totalBytes:         number
}

export interface DoctorEgressRow extends EgressStats {
  doctorId: string
}

export interface EgressPeriod {
  from: string  // ISO 8601
  to:   string  // ISO 8601
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Default: mese corrente (00:00 primo giorno → 23:59:59 ultimo giorno). */
export function currentMonth(): EgressPeriod {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

export function lastMonth(): EgressPeriod {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

function aggregate(rows: { source: string; bytes: number }[]): EgressStats {
  let tileBytes = 0, tileRequests = 0, inputDownloadBytes = 0

  for (const r of rows) {
    if (r.source === 'tile_view') {
      tileBytes += r.bytes
      tileRequests++
    } else if (r.source === 'input_download') {
      inputDownloadBytes += r.bytes
    }
  }

  return {
    tileBytes,
    tileRequests,
    inputDownloadBytes,
    totalBytes: tileBytes + inputDownloadBytes,
  }
}

// ─── Per-doctor egress ────────────────────────────────────────────────────────
// Usabile sia nella dashboard del singolo dottore che in quella admin.

export async function getDoctorEgress(
  doctorId: string,
  period: EgressPeriod = currentMonth()
): Promise<EgressStats> {
  const { data } = await adminClient()
    .from('egress_logs')
    .select('source, bytes')
    .eq('doctor_id', doctorId)
    .gte('created_at', period.from)
    .lte('created_at', period.to)

  return aggregate(data ?? [])
}

// ─── All-doctors breakdown (admin) ───────────────────────────────────────────

export async function getAllDoctorsEgress(
  period: EgressPeriod = currentMonth()
): Promise<DoctorEgressRow[]> {
  const { data } = await adminClient()
    .from('egress_logs')
    .select('doctor_id, source, bytes')
    .gte('created_at', period.from)
    .lte('created_at', period.to)

  if (!data) return []

  // Raggruppa per dottore
  const byDoctor = new Map<string, { source: string; bytes: number }[]>()
  for (const row of data) {
    if (!byDoctor.has(row.doctor_id)) byDoctor.set(row.doctor_id, [])
    byDoctor.get(row.doctor_id)!.push(row)
  }

  return Array.from(byDoctor.entries()).map(([doctorId, rows]) => ({
    doctorId,
    ...aggregate(rows),
  }))
}

// ─── Totale progetto (admin) ──────────────────────────────────────────────────

export async function getTotalEgress(
  period: EgressPeriod = currentMonth()
): Promise<EgressStats> {
  const { data } = await adminClient()
    .from('egress_logs')
    .select('source, bytes')
    .gte('created_at', period.from)
    .lte('created_at', period.to)

  return aggregate(data ?? [])
}
