'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function MonthPicker() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const current = sp.get('month') ?? new Date().toISOString().slice(0, 7)
  const [year, month] = current.split('-').map(Number)

  const label = new Date(year, month - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1)

  function navigate(offset: number) {
    const d = new Date(year, month - 1 + offset)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`${pathname}?month=${next}`)
  }

  const isCurrentMonth = current === new Date().toISOString().slice(0, 7)

  return (
    <div className="flex items-center gap-3 mb-8">
      <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 transition-colors">
        <ChevronLeft className="w-4 h-4 text-gray-400" />
      </button>
      <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">{labelCapitalized}</span>
      <button onClick={() => navigate(1)} disabled={isCurrentMonth} className="p-1 hover:bg-gray-100 transition-colors disabled:opacity-30">
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
      {!isCurrentMonth && (
        <button onClick={() => router.push(pathname)} className="text-[10px] text-gray-400 hover:text-gray-700 uppercase tracking-widest ml-2">
          oggi
        </button>
      )}
    </div>
  )
}
