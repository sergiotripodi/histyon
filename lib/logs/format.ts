// ─── Shared log formatting utilities ─────────────────────────────────────────
// Used by both doctor and admin log tab components.

export function parseUA(ua: string | null): string {
  if (!ua) return 'Dispositivo sconosciuto'
  if (/iPhone|iPad|iPod/i.test(ua)) return /iPad/i.test(ua) ? 'iPad' : 'iPhone'
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'Android (smartphone)' : 'Android (tablet)'
  if (/Macintosh|Mac OS X/i.test(ua)) {
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Mac · Chrome'
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Mac · Safari'
    if (/Firefox/i.test(ua)) return 'Mac · Firefox'
    if (/Edg/i.test(ua)) return 'Mac · Edge'
    return 'Mac'
  }
  if (/Windows/i.test(ua)) {
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Windows · Chrome'
    if (/Firefox/i.test(ua)) return 'Windows · Firefox'
    if (/Edg/i.test(ua)) return 'Windows · Edge'
    return 'Windows'
  }
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Dispositivo sconosciuto'
}

export function isMobile(ua: string | null): boolean {
  if (!ua) return false
  return /iPhone|iPad|iPod|Android/i.test(ua)
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 2)   return 'Adesso'
  if (mins < 60)  return `${mins} min fa`
  if (hours < 24) return `${hours} ore fa`
  if (days  < 7)  return `${days} giorni fa`
  return formatDateShort(iso)
}
