/**
 * Histyon — Load Test Cleanup
 * ─────────────────────────────────────────────────────────────────────────────
 * Rimuove TUTTI i dati di test dal DB (auth users + profiles + patients + tickets + egress_logs).
 * Identifica i record di test tramite l'email @test-histyon.fake.
 *
 * Usage:
 *   node tests/load/cleanup.mjs
 *   node tests/load/cleanup.mjs --dry-run   (mostra cosa verrebbe cancellato senza farlo)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync }  from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir   = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../../.env.local')

function loadEnv(path) {
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_0-9]+)="?([^"]*)"?$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

const env = loadEnv(envPath)
const db  = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const DRY_RUN = process.argv.includes('--dry-run')

console.log(`\n${'═'.repeat(60)}`)
console.log(`  HISTYON LOAD TEST CLEANUP${DRY_RUN ? ' [DRY RUN]' : ''}`)
console.log(`${'═'.repeat(60)}\n`)

// ── Find all test doctor IDs ──────────────────────────────────────────────────
const { data: testProfiles } = await db
  .from('profiles')
  .select('id, email')
  .like('email', '%@test-histyon.fake')

if (!testProfiles || testProfiles.length === 0) {
  console.log('  Nothing to clean up — no @test-histyon.fake profiles found.\n')
  process.exit(0)
}

const doctorIds = testProfiles.map(p => p.id)
console.log(`  Found ${testProfiles.length} test doctors:`)
testProfiles.forEach(p => console.log(`    - ${p.email} (${p.id})`))

// ── Count what will be deleted ────────────────────────────────────────────────
const [
  { count: patientCount },
  { count: ticketCount },
  { count: egressCount },
] = await Promise.all([
  db.from('patients').select('*', { count: 'exact', head: true }).in('doctor_id', doctorIds),
  db.from('tickets').select('*', { count: 'exact', head: true }).in('doctor_id', doctorIds),
  db.from('egress_logs').select('*', { count: 'exact', head: true }).in('doctor_id', doctorIds),
])

console.log(`\n  Will delete:`)
console.log(`    ${patientCount}  patients`)
console.log(`    ${ticketCount}  tickets`)
console.log(`    ${egressCount}  egress_logs`)
console.log(`    ${doctorIds.length}  auth users + profiles`)

if (DRY_RUN) {
  console.log('\n  [DRY RUN] No data was deleted. Remove --dry-run to proceed.\n')
  process.exit(0)
}

console.log('\n  Deleting...')

// ── Delete in FK order ────────────────────────────────────────────────────────
// egress_logs → tickets → patients → profiles → auth.users

const { error: e1 } = await db.from('egress_logs').delete().in('doctor_id', doctorIds)
if (e1) console.error('  ✗ egress_logs:', e1.message)
else    console.log(`  ✓ egress_logs deleted`)

const { error: e2 } = await db.from('tickets').delete().in('doctor_id', doctorIds)
if (e2) console.error('  ✗ tickets:', e2.message)
else    console.log(`  ✓ tickets deleted`)

const { error: e3 } = await db.from('patients').delete().in('doctor_id', doctorIds)
if (e3) console.error('  ✗ patients:', e3.message)
else    console.log(`  ✓ patients deleted`)

const { error: e4 } = await db.from('profiles').delete().in('id', doctorIds)
if (e4) console.error('  ✗ profiles:', e4.message)
else    console.log(`  ✓ profiles deleted`)

// Delete auth users last
let deletedAuth = 0
for (const id of doctorIds) {
  const { error } = await db.auth.admin.deleteUser(id)
  if (error) console.error(`  ✗ auth user ${id}:`, error.message)
  else deletedAuth++
}
console.log(`  ✓ ${deletedAuth}/${doctorIds.length} auth users deleted`)

console.log(`\n${'═'.repeat(60)}`)
console.log('  CLEANUP COMPLETE — DB restored to pre-test state')
console.log(`${'═'.repeat(60)}\n`)
