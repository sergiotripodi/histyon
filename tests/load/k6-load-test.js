/**
 * Histyon — k6 Load Test Suite
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests 4 realistic scenarios for a medical-image SaaS with concurrent doctors.
 *
 * SETUP (once):
 *   brew install k6                     # macOS
 *   or: docker run grafana/k6 run -     # Docker
 *
 * RUN (against local dev — NEVER against production at high concurrency):
 *   # Start local Supabase + Next.js first:
 *   #   npx supabase start
 *   #   npm run dev
 *
 *   k6 run tests/load/k6-load-test.js
 *   k6 run tests/load/k6-load-test.js --env BASE_URL=http://localhost:3000
 *   k6 run tests/load/k6-load-test.js --out json=tests/load/results/k6-$(date +%s).json
 *
 * SMOKE TEST (quick sanity, 1 VU):
 *   k6 run --vus 1 --duration 30s tests/load/k6-load-test.js
 *
 * SCENARIOS:
 *   1. baseline_health     — health check endpoint, no auth
 *   2. doctor_dashboard    — simulate doctor browsing dashboard (auth + DB reads)
 *   3. concurrent_doctors  — 50 doctors simultaneously loading their patient lists
 *   4. tile_viewer         — simulates WSI tile streaming (the egress bottleneck)
 */

import http      from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL     = __ENV.BASE_URL     || 'http://localhost:3000'
const ANON_KEY     = __ENV.ANON_KEY     || ''   // NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = __ENV.SUPABASE_URL || ''   // NEXT_PUBLIC_SUPABASE_URL

// ── Custom metrics ────────────────────────────────────────────────────────────
const errorRate     = new Rate('errors')
const dbQueryTime   = new Trend('db_query_duration_ms', true)
const tileLoadTime  = new Trend('tile_load_duration_ms', true)
const authTime      = new Trend('auth_duration_ms', true)
const egressBytes   = new Counter('simulated_egress_bytes')

// ── Thresholds (SLOs — test FAILS if these are violated) ─────────────────────
export const options = {
  scenarios: {

    // 1. Always-on health check — baseline, 1 VU for 30s
    baseline_health: {
      executor:  'constant-vus',
      vus:       1,
      duration:  '30s',
      exec:      'healthCheck',
      tags:      { scenario: 'baseline' },
    },

    // 2. Single doctor session — realistic browse pattern
    doctor_dashboard: {
      executor:   'ramping-vus',
      startVUs:   0,
      stages: [
        { duration: '10s', target: 5  },   // ramp up
        { duration: '40s', target: 5  },   // steady state
        { duration: '10s', target: 0  },   // ramp down
      ],
      exec:       'doctorSession',
      tags:       { scenario: 'doctor_session' },
      startTime:  '5s',
    },

    // 3. Concurrent doctors — peak load simulation
    concurrent_doctors: {
      executor:   'ramping-vus',
      startVUs:   0,
      stages: [
        { duration: '15s', target: 20  },  // ramp to 20 concurrent doctors
        { duration: '30s', target: 50  },  // ramp to 50 (stress test)
        { duration: '15s', target: 0   },  // ramp down
      ],
      exec:       'concurrentDoctor',
      tags:       { scenario: 'concurrent_doctors' },
      startTime:  '65s',
    },

    // 4. Tile viewer — DZI streaming egress bottleneck
    tile_viewer: {
      executor:   'constant-vus',
      vus:        10,
      duration:   '30s',
      exec:       'tileViewer',
      tags:       { scenario: 'tile_egress' },
      startTime:  '130s',
    },
  },

  thresholds: {
    // Global error rate < 1%
    errors:                         ['rate<0.01'],
    // Health check: p95 < 200ms
    'http_req_duration{scenario:baseline}':        ['p(95)<200'],
    // Doctor dashboard reads: p95 < 500ms (includes DB round-trip)
    'http_req_duration{scenario:doctor_session}':  ['p(95)<500'],
    // Under load (50 concurrent): p95 < 1000ms
    'http_req_duration{scenario:concurrent_doctors}': ['p(95)<1000'],
    // Tile loads: p95 < 2000ms (tile redirect + storage fetch)
    'tile_load_duration_ms':        ['p(95)<2000'],
  },
}

// ── Helper: make authenticated Supabase API request ───────────────────────────
function supabaseGet(path, params = {}) {
  if (!SUPABASE_URL || !ANON_KEY) return null
  const qs  = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  const url  = `${SUPABASE_URL}/rest/v1/${path}${qs ? '?' + qs : ''}`
  const t0   = Date.now()
  const res  = http.get(url, {
    headers: {
      apikey:        ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      Accept:        'application/json',
    },
  })
  dbQueryTime.add(Date.now() - t0)
  return res
}

// ── Scenario 1: Health check ──────────────────────────────────────────────────
export function healthCheck() {
  const res = http.get(`${BASE_URL}/api/health`)
  const ok  = check(res, {
    'health status 200':           r => r.status === 200,
    'health reports healthy':      r => { try { return JSON.parse(r.body).status === 'healthy' } catch { return false } },
    'health responds under 300ms': r => r.timings.duration < 300,
  })
  errorRate.add(!ok)
  sleep(1)
}

// ── Scenario 2: Doctor session — browse dashboard ─────────────────────────────
// Simulates: landing on dashboard → patients list → analysis list → patient detail
export function doctorSession() {
  // Step 1: dashboard home (middleware + DB profile lookup)
  const home = http.get(`${BASE_URL}/dashboard/home`, { tags: { page: 'home' } })
  check(home, { 'dashboard responds': r => r.status === 200 || r.status === 302 })
  sleep(0.5)

  // Step 2: patients list (DB query with pagination)
  const patients = http.get(`${BASE_URL}/dashboard/patients`, { tags: { page: 'patients' } })
  check(patients, { 'patients responds': r => r.status === 200 || r.status === 302 })
  sleep(1)

  // Step 3: analysis list (DB query with pagination)
  const analyses = http.get(`${BASE_URL}/dashboard/analysis`, { tags: { page: 'analysis' } })
  check(analyses, { 'analysis responds': r => r.status === 200 || r.status === 302 })
  sleep(2)
}

// ── Scenario 3: Concurrent doctors ───────────────────────────────────────────
// Lighter version — just loads the page and moves on
export function concurrentDoctor() {
  const pages = [
    '/dashboard/home',
    '/dashboard/patients',
    '/dashboard/analysis',
  ]
  const page = pages[Math.floor(Math.random() * pages.length)]
  const res  = http.get(`${BASE_URL}${page}`)
  const ok   = check(res, {
    'page responds': r => [200, 302, 303].includes(r.status),
    'not 500':       r => r.status !== 500,
  })
  errorRate.add(!ok)
  sleep(Math.random() * 3 + 1)   // 1-4s think time between requests
}

// ── Scenario 4: Tile viewer — DZI egress bottleneck ──────────────────────────
// Simulates requesting DZI tiles (the #1 egress driver)
// Replace TICKET_ID with a real ticket ID from your DB for meaningful results
export function tileViewer() {
  const TICKET_ID = __ENV.TICKET_ID || 'replace-with-real-ticket-uuid'

  // DZI manifest
  const t0  = Date.now()
  const dzi = http.get(`${BASE_URL}/api/tiles/${TICKET_ID}/slide.dzi`, {
    tags: { type: 'dzi_manifest' },
  })
  tileLoadTime.add(Date.now() - t0)

  check(dzi, {
    'DZI manifest responds': r => [200, 302, 404].includes(r.status),
  })

  // Simulate loading 10 tiles at level 10 (realistic viewer behavior)
  const batch = http.batch(
    Array.from({ length: 10 }, (_, i) => [
      'GET',
      `${BASE_URL}/api/tiles/${TICKET_ID}/slide_files/10/${i}_0.jpg`,
      null,
      { tags: { type: 'dzi_tile' } },
    ])
  )

  // Each tile ≈ 50KB → 10 tiles ≈ 500KB egress
  egressBytes.add(500 * 1024)

  for (const [, tile] of Object.entries(batch)) {
    const ok = check(tile, { 'tile responds': r => [200, 302, 404].includes(r.status) })
    errorRate.add(!ok)
  }

  sleep(2)
}

// ── handleSummary: save results as JSON ──────────────────────────────────────
export function handleSummary(data) {
  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const path = `tests/load/results/k6-${ts}.json`
  return { [path]: JSON.stringify(data, null, 2), stdout: textSummary(data) }
}

function textSummary(data) {
  const m  = data.metrics
  const p  = (metric, pct) => m[metric]?.values?.[`p(${pct})`]?.toFixed(0) ?? 'N/A'
  const r  = (metric)      => (m[metric]?.values?.rate * 100)?.toFixed(2) ?? 'N/A'

  return `
╔══════════════════════════════════════════════════════════════╗
║  HISTYON LOAD TEST SUMMARY                                   ║
╠══════════════════════════════════════════════════════════════╣
║  HTTP Request Duration                                       ║
║    p50: ${p('http_req_duration', 50).padStart(6)}ms   p95: ${p('http_req_duration', 95).padStart(6)}ms   p99: ${p('http_req_duration', 99).padStart(6)}ms  ║
║  Error Rate : ${r('errors').padStart(5)}%                                        ║
║  Total Reqs : ${String(m.http_reqs?.values?.count ?? 'N/A').padStart(8)}                                   ║
╚══════════════════════════════════════════════════════════════╝

Run: k6 run tests/load/k6-load-test.js
     k6 run --vus 1 --duration 30s tests/load/k6-load-test.js  (smoke)
`
}
