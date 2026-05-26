/**
 * Histyon — Load Test Seed
 * ─────────────────────────────────────────────────────────────────────────────
 * Popola il DB con dati finti realistici per i load test.
 * TUTTI i record sono marcati con @test-histyon.fake → sicuri da cancellare.
 *
 * Crea (default):
 *   10 dottori   (auth users + profiles via trigger → status aggiornato ad approved)
 *   50 pazienti  per dottore  =  500 pazienti totali
 *   30 ticket    per paziente = 15.000 ticket totali
 *    3 egress_log per ticket  = ~27.000 egress_logs (solo ticket COMPLETED)
 *
 * Usage:
 *   node tests/load/seed.mjs
 *   node tests/load/seed.mjs --doctors 5 --patients 20 --tickets 10
 *
 * Cleanup:
 *   node tests/load/cleanup.mjs
 *
 * NOTE: crea auth users tramite admin API passando user_metadata completo
 * affinché il trigger handle_new_user() crei correttamente il profile.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
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

const args       = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => { if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] ?? true]); return acc }, []))
const N_DOCTORS  = parseInt(args.doctors  ?? 10)
const N_PATIENTS = parseInt(args.patients ?? 50)
const N_TICKETS  = parseInt(args.tickets  ?? 30)

// ── helpers ───────────────────────────────────────────────────────────────────
function randDate(daysBack = 365) {
  return new Date(Date.now() - Math.random() * daysBack * 86400_000).toISOString()
}

const STATUSES = ['COMPLETED','COMPLETED','COMPLETED','COMPLETED','QUEUED','PROCESSING','ERROR']
const randStatus = () => STATUSES[Math.floor(Math.random() * STATUSES.length)]

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function bulkInsert(table, rows, label) {
  if (rows.length === 0) { console.log(`  ✓ ${label}: 0 rows (skipped)`); return 0 }
  let inserted = 0
  for (const batch of chunk(rows, 500)) {
    const { error } = await db.from(table).insert(batch)
    if (error) { console.error(`\n  ✗ ${label} batch error:`, error.message); continue }
    inserted += batch.length
    process.stdout.write(`\r  ${label}: ${inserted}/${rows.length}  `)
  }
  console.log(`\r  ✓ ${label}: ${inserted} rows                    `)
  return inserted
}

// ── main ──────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(62)}`)
console.log('  HISTYON LOAD TEST SEED')
console.log(`  ${N_DOCTORS} dottori × ${N_PATIENTS} pazienti × ${N_TICKETS} ticket`)
console.log(`  Totale: ${(N_DOCTORS * N_PATIENTS).toLocaleString()} pazienti, ${(N_DOCTORS * N_PATIENTS * N_TICKETS).toLocaleString()} ticket`)
console.log(`${'═'.repeat(62)}\n`)

// ── 1. Auth users → profiles (via handle_new_user trigger) ───────────────────
// Pass full user_metadata so the trigger can populate all NOT NULL profile cols.
console.log('Step 1/4 — Creating fake doctor auth users + profiles...')
const doctorIds = []

for (let i = 1; i <= N_DOCTORS; i++) {
  const email = `load-doctor-${i}@test-histyon.fake`

  // Check if already exists
  const { data: existing } = await db.from('profiles').select('id').eq('email', email).maybeSingle()
  if (existing) {
    doctorIds.push(existing.id)
    process.stdout.write(`\r  profiles: ${doctorIds.length}/${N_DOCTORS} (reused existing)  `)
    continue
  }

  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      first_name:      `LoadDoc${i}`,
      last_name:       'TestUser',
      fiscal_code:     `TSTDOC${String(i).padStart(10, '0')}`,
      medical_license: `ML${String(i).padStart(8, '0')}`,
      hospital_name:   `Test Hospital ${i}`,
      dob:             '1980-01-01',
      place_of_birth:  'Milan',
      gender:          'M',
      address_street:  'Via Test',
      address_civic:   '1',
      city:            'Milan',
      country:         'Italy',
      region:          'Lombardia',
      postal_code:     '20100',
      phone:           `+3902000000${String(i).padStart(2, '0')}`,
    },
  })

  if (error) { console.error(`\n  ✗ createUser ${email}:`, error.message); continue }
  doctorIds.push(data.user.id)
  process.stdout.write(`\r  profiles: ${doctorIds.length}/${N_DOCTORS}  `)
}
console.log()

// Update all test profiles to approved (trigger creates them as pending)
await db.from('profiles').update({ status: 'approved' }).like('email', '%@test-histyon.fake')
console.log(`  ✓ profiles: ${doctorIds.length} doctors set to approved`)

// ── 2. Patients ───────────────────────────────────────────────────────────────
console.log('\nStep 2/4 — Inserting patients...')
const patients   = []
const patientMap = {}

let seq = 0
for (const doctorId of doctorIds) {
  patientMap[doctorId] = []
  for (let p = 0; p < N_PATIENTS; p++) {
    const id = crypto.randomUUID()
    patientMap[doctorId].push(id)
    patients.push({
      id,
      doctor_id:     doctorId,
      first_name:    `Paziente${p + 1}`,
      last_name:     `Test${seq}`,
      fiscal_code:   String(seq).padStart(16, 'A'),
      date_of_birth: `${1950 + (seq % 50)}-${String((seq % 12) + 1).padStart(2,'0')}-01`,
      created_at:    randDate(365),
    })
    seq++
  }
}
await bulkInsert('patients', patients, 'patients')

// ── 3. Tickets ────────────────────────────────────────────────────────────────
console.log('\nStep 3/4 — Inserting tickets...')
const tickets = []
for (const doctorId of doctorIds) {
  for (const patientId of patientMap[doctorId]) {
    for (let t = 0; t < N_TICKETS; t++) {
      const createdAt = randDate(365)
      tickets.push({
        id:          crypto.randomUUID(),
        doctor_id:   doctorId,
        patient_id:  patientId,
        status:      randStatus(),
        input_bytes: Math.floor(Math.random() * 4 * 1024 ** 3) + 50_000_000,
        created_at:  createdAt,
        updated_at:  createdAt,
      })
    }
  }
}
await bulkInsert('tickets', tickets, 'tickets')

// ── 4. Egress logs (only for COMPLETED tickets) ───────────────────────────────
console.log('\nStep 4/4 — Inserting egress_logs...')
const egressLogs = []
for (const t of tickets) {
  if (t.status !== 'COMPLETED') continue
  egressLogs.push({
    doctor_id:  t.doctor_id,
    ticket_id:  t.id,
    source:     'input_download',
    bytes:      t.input_bytes,
    created_at: t.created_at,
  })
  const views = Math.floor(Math.random() * 5) + 1
  for (let v = 0; v < views; v++) {
    egressLogs.push({
      doctor_id:  t.doctor_id,
      ticket_id:  t.id,
      source:     'tile_view',
      bytes:      Math.floor(Math.random() * 200_000_000) + 10_000_000,
      created_at: randDate(180),
    })
  }
}
await bulkInsert('egress_logs', egressLogs, 'egress_logs')

// ── Save seed metadata ────────────────────────────────────────────────────────
mkdirSync(resolve(__dir, 'results'), { recursive: true })
const meta = {
  seeded_at:  new Date().toISOString(),
  doctor_ids: doctorIds,
  counts: {
    doctors:    doctorIds.length,
    patients:   patients.length,
    tickets:    tickets.length,
    egress_logs: egressLogs.length,
  },
}
writeFileSync(resolve(__dir, 'results/seed-meta.json'), JSON.stringify(meta, null, 2))

const total = patients.length + tickets.length + egressLogs.length
console.log(`\n${'═'.repeat(62)}`)
console.log('  SEED COMPLETE')
console.log(`  Profiles   : ${meta.counts.doctors}`)
console.log(`  Patients   : ${meta.counts.patients.toLocaleString()}`)
console.log(`  Tickets    : ${meta.counts.tickets.toLocaleString()}`)
console.log(`  Egress logs: ${meta.counts.egress_logs.toLocaleString()}`)
console.log(`  Total rows : ${total.toLocaleString()}`)
console.log(`\n  Doctor IDs salvati → tests/load/results/seed-meta.json`)
console.log(`  Esegui benchmark:  node tests/load/db-benchmark.mjs`)
console.log(`  Pulizia DB:        node tests/load/cleanup.mjs`)
console.log(`${'═'.repeat(62)}\n`)
