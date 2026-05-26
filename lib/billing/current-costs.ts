function parseResendDate(raw: unknown): Date | null {
  if (!raw) return null
  const s = String(raw).trim()
    .replace(' ', 'T')
    .replace(/(\+00(?::00)?|Z)?$/, 'Z')
    .replace(/\.\d{4,}Z$/, (m) => m.slice(0, 4) + 'Z')
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export async function countResendEmailsForPeriod(
  key: string,
  startMs: number,
  endMs: number,
): Promise<number | null> {
  const monthStart = new Date(startMs)
  const monthEnd   = new Date(endMs)
  let total = 0, offset = 0
  try {
    for (let page = 0; page < 10; page++) {
      const res = await fetch(`https://api.resend.com/emails?limit=100&offset=${offset}`, {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 300 },
      })
      if (!res.ok) return total > 0 ? total : null
      const emails: any[] = (await res.json()).data ?? []
      if (!emails.length) break
      let done = false
      for (const e of emails) {
        const created = parseResendDate(e.created_at)
        if (!created) continue
        if (created >= monthStart && created < monthEnd) total++
        else if (created < monthStart) { done = true; break }
      }
      if (done || emails.length < 100) break
      offset += 100
    }
    return total
  } catch { return null }
}
