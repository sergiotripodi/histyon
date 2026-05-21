'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getRecentMonths(n: number, minMonth?: string): { key: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
      .replace('.', '').replace(' ', ' ')
    return { key, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })
    .filter(m => !minMonth || m.key >= minMonth)
    .reverse()
}

interface MonthPickerProps {
  /** Mese minimo selezionabile, es. '2026-05' */
  minMonth?: string
}

export function MonthPicker({ minMonth }: MonthPickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const nowKey = new Date().toISOString().slice(0, 7)
  const current = sp.get('month') ?? nowKey

  // Clamp: se il mese corrente è prima del minimo, vai al minimo
  const clamped = minMonth && current < minMonth ? minMonth : current
  const [year, month] = clamped.split('-').map(Number)

  const recent = getRecentMonths(12, minMonth)
  const isInRecent = recent.some(m => m.key === clamped)

  function go(key: string) {
    if (key === nowKey) {
      router.push(pathname)
    } else {
      router.push(`${pathname}?month=${key}`)
    }
  }

  function navigateArrow(offset: number) {
    const d = new Date(year, month - 1 + offset)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (minMonth && key < minMonth) return
    go(key)
  }

  const atMin = !!minMonth && clamped <= minMonth
  const atMax = clamped === nowKey

  // Label for a month outside the quick tabs
  const selectedLabel = !isInRecent
    ? new Date(year, month - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex items-center gap-2 mb-8 flex-wrap">
      <button
        onClick={() => navigateArrow(-1)}
        disabled={atMin}
        className="p-1.5 hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mese precedente"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {recent.map(m => (
        <button
          key={m.key}
          onClick={() => go(m.key)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
            clamped === m.key
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          {m.label}
        </button>
      ))}

      {!isInRecent && selectedLabel && (
        <span className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white border border-gray-900">
          {selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}
        </span>
      )}

      <button
        onClick={() => navigateArrow(1)}
        disabled={atMax}
        className="p-1.5 hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mese successivo"
      >
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {clamped !== nowKey && (
        <button
          onClick={() => go(nowKey)}
          className="ml-1 text-[10px] text-gray-400 hover:text-gray-700 uppercase tracking-widest"
        >
          oggi
        </button>
      )}
    </div>
  )
}
