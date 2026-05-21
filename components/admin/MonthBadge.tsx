interface MonthBadgeProps {
  monthStr: string
  /** Se true mostra il dot verde "live" */
  live?: boolean
}

export function MonthBadge({ monthStr, live = false }: MonthBadgeProps) {
  const label = new Date(monthStr + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const labelCap = label.charAt(0).toUpperCase() + label.slice(1)

  return (
    <span className="inline-flex items-center gap-0 shrink-0 overflow-hidden">
      <span className={`w-[3px] self-stretch shrink-0 ${live ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      <span className="border border-l-0 border-gray-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-700 whitespace-nowrap">
        {labelCap}
      </span>
    </span>
  )
}
