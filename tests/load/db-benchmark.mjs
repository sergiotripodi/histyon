/**
 * Histyon DB Latency Benchmark
 * ─────────────────────────────
 * Measures real Supabase query latency for the 5 hottest query patterns.
 * Uses the SERVICE ROLE key — READ ONLY queries, safe to run against production.
 *
 * Usage:
 *   node tests/load/db-benchmark.mjs
 *   node tests/load/db-benchmark.mjs --iterations 100 --concurrency 10
 *
 * Output: tests/load/results/benchmark-<timestamp>.json + terminal summary
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load env vars from .env.local ────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
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
const SUPABASE_URL      = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SRV_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SRV_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] ?? true])
    return acc
  }, [])
)
const ITERATIONS  = parseInt(args.iterations  ?? 50)
const CONCURRENCY = parseInt(args.concurrency ?? 5)

// ── Supabase admin client ─────────────────────────────────────────────────────
const db = createClient(SUPABASE_URL, SUPABASE_SRV_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Stats helpers ─────────────────────────────────────────────────────────────
function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

function stats(samples) {
  const s = [...samples].sort((a, b) => a - b)
  return {
    min:  Math.round(s[0] * 100) / 100,
    max:  Math.round(s[s.length - 1] * 100) / 100,
    p50:  Math.round(percentile(s, 50)  * 100) / 100,
    p95:  Math.round(percentile(s, 95)  * 100) / 100,
    p99:  Math.round(percentile(s, 99)  * 100) / 100,
    mean: Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 100) / 100,
  }
}

// ── Query definitions ─────────────────────────────────────────────────────────
const QUERIES = [
  {
    name: 'middleware_profile_lookup',
    description: 'SELECT role, status FROM profiles WHERE id = $1 (runs on every auth request)',
    run: () => db.from('profiles').select('role, status').eq('id', '00000000-0000-0000-0000-000000000001'),
  },
  {
    name: 'paginated_tickets',
    description: 'SELECT tickets WHERE doctor_id = $1 ORDER BY created_at DESC LIMIT 20',
    run: () => db.from('tickets').select('id, status, created_at, patient_id').eq('doctor_id', '00000000-0000-0000-0000-000000000001').order('created_at', { ascending: false }).range(0, 19),
  },
  {
    name: 'paginated_patients',
    description: 'SELECT patients WHERE doctor_id = $1 ORDER BY created_at DESC LIMIT 20',
    run: () => db.from('patients').select('id, first_name, last_name, fiscal_code').eq('doctor_id', '00000000-0000-0000-0000-000000000001').order('created_at', { ascending: false }).range(0, 19),
  },
  {
    name: 'admin_ticket_stats_rpc',
    description: 'get_admin_ticket_stats() — COUNT aggregation (replaces 50k row fetch)',
    run: () => db.rpc('get_admin_ticket_stats'),
  },
  {
    name: 'admin_users_list',
    description: 'SELECT profiles WHERE role != admin ORDER BY created_at DESC',
    run: () => db.from('profiles').select('id, email, first_name, last_name, status, created_at').neq('role', 'admin').order('created_at', { ascending: false }),
  },
  {
    name: 'storage_presign_download',
    description: 'createSignedUrl for tile proxy (called on every tile request by the viewer)',
    // Uses a non-existent path — presign generation time is independent of file existence
    run: () => db.storage.from('tissues').createSignedUrl('benchmark/test-tile.dzi', 60),
  },
  {
    name: 'upload_patient_ownership_check',
    description: 'SELECT patients WHERE id=$1 AND doctor_id=$2 (called before every upload)',
    run: () => db.from('patients').select('id').eq('id', '00000000-0000-0000-0000-000000000001').eq('doctor_id', '00000000-0000-0000-0000-000000000001').maybeSingle(),
  },
]

// ── Benchmark runner ──────────────────────────────────────────────────────────
async function runBatch(query, concurrency) {
  return Promise.all(Array.from({ length: concurrency }, async () => {
    const t0 = performance.now()
    await query.run()
    return performance.now() - t0
  }))
}

async function benchmark(query) {
  const samples = []
  const batches = Math.ceil(ITERATIONS / CONCURRENCY)

  process.stdout.write(`  ${query.name.padEnd(32)}`)

  for (let b = 0; b < batches; b++) {
    const batchSize = Math.min(CONCURRENCY, ITERATIONS - b * CONCURRENCY)
    const times = await runBatch({ run: query.run }, batchSize)
    samples.push(...times)
    process.stdout.write('.')
  }
  console.log()

  return { query: query.name, description: query.description, iterations: samples.length, ...stats(samples) }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(72)}`)
console.log('  HISTYON DB LATENCY BENCHMARK')
console.log(`  Target  : ${SUPABASE_URL}`)
console.log(`  Queries : ${QUERIES.length}`)
console.log(`  Iter    : ${ITERATIONS} per query  |  Concurrency: ${CONCURRENCY}`)
console.log(`${'═'.repeat(72)}\n`)

const results = []
for (const q of QUERIES) {
  results.push(await benchmark(q))
}

// ── Print table ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(72)}`)
console.log(`  ${'Query'.padEnd(34)} ${'p50'.padStart(7)} ${'p95'.padStart(7)} ${'p99'.padStart(7)} ${'max'.padStart(7)}  Status`)
console.log(`${'─'.repeat(72)}`)

for (const r of results) {
  const ok     = r.p95 < 200  ? '✅ fast' : r.p95 < 500 ? '⚠️  ok' : '❌ slow'
  const name   = r.query.padEnd(34).slice(0, 34)
  console.log(`  ${name} ${String(r.p50 + 'ms').padStart(7)} ${String(r.p95 + 'ms').padStart(7)} ${String(r.p99 + 'ms').padStart(7)} ${String(r.max + 'ms').padStart(7)}  ${ok}`)
}
console.log(`${'─'.repeat(72)}`)

// ── Supabase limit context ────────────────────────────────────────────────────
console.log(`
┌─ SUPABASE LIMITS (what you're using) ─────────────────────────────────────┐
│  Free tier:  500 MB DB  │  1 GB Storage  │  5 GB Egress  │  50K MAU       │
│  Pro tier:   8 GB DB    │  100 GB Storage│  250 GB Egress│  50K MAU       │
│                                                                            │
│  BOTTLENECK #1 — Storage Egress (most critical for this app)               │
│    1 WSI slide view ≈ 50-200 MB egress (DZI tile streaming)               │
│    Free limit hits after: ~10-25 slide views                               │
│    Pro limit hits after:  ~1250-5000 slide views/month                     │
│                                                                            │
│  BOTTLENECK #2 — DB Connections                                            │
│    Supabase uses PgBouncer → each Vercel fn gets pooled connection         │
│    Free: 60 max connections  │  Pro: depends on compute size               │
│    With 100 concurrent doctors: needs ~100 connections (pooled to ~20)     │
│                                                                            │
│  BOTTLENECK #3 — API Rate Limit                                            │
│    Supabase API: 500 req/sec (free)  │  5000 req/sec (pro)                 │
│    100 doctors × 5 req/pageload = 500 req — hits free limit immediately    │
└────────────────────────────────────────────────────────────────────────────┘
`)

// ── Save results ──────────────────────────────────────────────────────────────
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outPath   = resolve(__dir, `results/benchmark-${timestamp}.json`)

mkdirSync(resolve(__dir, 'results'), { recursive: true })

const report = {
  meta: {
    timestamp: new Date().toISOString(),
    target:    SUPABASE_URL,
    iterations: ITERATIONS,
    concurrency: CONCURRENCY,
    region: 'eu-west-1',
  },
  queries: results,
  limits: {
    note: 'Supabase Pro tier (what to plan for)',
    db_max_gb:       8,
    storage_max_gb:  100,
    egress_max_gb:   250,
    mau_included:    50_000,
    api_req_per_sec: 5000,
    connections_pooled: 'PgBouncer transaction mode',
  },
  bottlenecks: [
    { rank: 1, name: 'Storage Egress', description: 'Each WSI tile view streams 50-200MB. On Pro, 5000 views/month max.', mitigation: 'Cache signed URLs in browser (already done, 60s TTL). Add CDN for public tiles.' },
    { rank: 2, name: 'DB Connections', description: 'Serverless Vercel functions create new connections each invocation. PgBouncer pools them.', mitigation: 'Already mitigated by Supabase PgBouncer. Middleware query is 1 SELECT per request.' },
    { rank: 3, name: 'API Rate Limit', description: '500 req/sec on free, 5000 on pro. 100 concurrent doctors × 10 req = 1000 req burst.', mitigation: 'Rate limiting on write endpoints (already done). Read endpoints: CDN caching.' },
  ],
}

writeFileSync(outPath, JSON.stringify(report, null, 2))
console.log(`\n  Results saved → ${outPath}\n`)
