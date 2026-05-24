/**
 * Supabase Management API client.
 *
 * Endpoint principali:
 *  - GET /v1/organizations              → lista org, restituisce SOLO {id, slug, name} (no plan!)
 *  - GET /v1/organizations/{id}         → dettaglio org, INCLUDE plan
 *  - GET /v1/projects/{ref}             → dettaglio progetto
 *  - GET /v1/projects/{ref}/usage       → metriche di utilizzo con limiti per piano
 *
 * Il piano si ottiene SOLO dal dettaglio org, non dalla lista. Per questo
 * la dashboard mostrava sempre "free": chiamavamo la lista.
 */

export interface SbOrg {
  id:    string
  slug:  string
  name:  string
  plan?: 'free' | 'pro' | 'team' | 'enterprise' | string
}

export interface SbManagementResult {
  org:         SbOrg | null
  project:     any
  usageJson:   any                // risposta /v1/projects/{ref}/usage
  isPro:       boolean            // plan !== 'free' && plan != null
  status: {
    org:   number
    proj:  number
    usage: number
  }
  errors:      string[]
}

const BASE = 'https://api.supabase.com'

async function safeFetch(url: string, headers: Record<string, string>, revalidate = 300) {
  try {
    const res = await fetch(url, { headers, next: { revalidate } })
    const json = res.ok ? await res.json().catch(() => null) : null
    return { res, json }
  } catch {
    return { res: null as Response | null, json: null }
  }
}

export async function fetchSupabaseManagement(opts: {
  token:      string
  projectId:  string
  revalidate?: number
}): Promise<SbManagementResult> {
  const { token, projectId, revalidate = 300 } = opts
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const errors: string[] = []

  // Step 1: prendiamo project + lista org in parallelo
  const [orgsRes, projRes] = await Promise.all([
    safeFetch(`${BASE}/v1/organizations`,           headers, revalidate),
    safeFetch(`${BASE}/v1/projects/${projectId}`,   headers, revalidate),
  ])

  let org: SbOrg | null = null
  let orgStatus = orgsRes.res?.status ?? 0
  let projStatus = projRes.res?.status ?? 0

  // Step 2: dal projects abbiamo organization_id, usiamolo per fetchare DETTAGLIO org (con plan)
  const projectJson = projRes.json
  const orgId: string | undefined =
       projectJson?.organization_id
    ?? (Array.isArray(orgsRes.json) && orgsRes.json[0]?.id)
    ?? undefined

  if (orgId) {
    const detail = await safeFetch(`${BASE}/v1/organizations/${orgId}`, headers, revalidate)
    orgStatus = detail.res?.status ?? orgStatus
    if (detail.json) {
      org = detail.json as SbOrg
    } else if (Array.isArray(orgsRes.json) && orgsRes.json[0]) {
      // fallback: usa info dalla lista (ma senza plan)
      org = orgsRes.json[0] as SbOrg
      errors.push('Org dettaglio non recuperabile (plan mancherà)')
    }
  } else {
    errors.push('Nessun organization_id trovato per il progetto')
  }

  // Step 3: usage (chiamata separata, può fallire senza bloccare tutto)
  const usage = await safeFetch(`${BASE}/v1/projects/${projectId}/usage`, headers, revalidate)
  const usageStatus = usage.res?.status ?? 0
  const usageJson = usage.json

  if (!projRes.json) errors.push(`project HTTP ${projStatus}`)
  if (!org)          errors.push(`org HTTP ${orgStatus}`)
  if (!usageJson)    errors.push(`usage HTTP ${usageStatus}`)

  const plan = org?.plan ?? null
  const isPro = !!plan && plan !== 'free'

  return {
    org,
    project: projectJson,
    usageJson,
    isPro,
    status: { org: orgStatus, proj: projStatus, usage: usageStatus },
    errors,
  }
}

/** Estrae un valore di utilizzo dalla risposta usage (gestisce vari formati API) */
export function extractSbUsage(usageJson: any, keys: string[]): number | null {
  if (!usageJson) return null
  for (const k of keys) {
    if (usageJson[k] != null && typeof usageJson[k] !== 'object') return Number(usageJson[k])
  }
  const arr: any[] = usageJson.usages ?? usageJson.metrics ?? []
  for (const k of keys) {
    const found = arr.find((m: any) => m.metric === k)
    if (found != null) {
      if (found.available_in_plan === false) return -1
      if (found.usage != null) return Number(found.usage)
    }
  }
  return null
}

/** Estrae il limite incluso nel piano dalla risposta usage */
export function extractSbLimit(usageJson: any, keys: string[]): number | null {
  if (!usageJson) return null
  const arr: any[] = usageJson.usages ?? usageJson.metrics ?? []
  for (const k of keys) {
    const found = arr.find((m: any) => m.metric === k)
    if (found?.limit != null) return Number(found.limit)
  }
  return null
}
