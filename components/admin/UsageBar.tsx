'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface UsageBarProps {
  label: string
  used: number
  limit: number
  unit?: string
  href?: string
  formatValue?: (v: number) => string
}

function defaultFormat(v: number, unit: string): string {
  if (unit === 'GB') return `${v.toFixed(1)} GB`
  if (unit === 'MB') return `${v.toFixed(1)} MB`
  if (unit === '$') return `$${v.toFixed(2)}`
  return `${v.toLocaleString('it-IT')} ${unit}`.trim()
}

export function UsageBar({ label, used, limit, unit = '', href, formatValue }: UsageBarProps) {
  const unlimited = limit === 0
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100)
  const fmt = formatValue ?? ((v: number) => defaultFormat(v, unit))

  const color =
    pct >= 90 ? 'bg-red-500'
    : pct >= 70 ? 'bg-amber-500'
    : 'bg-gray-900'

  const inner = (
    <div className={`border border-gray-200 bg-white p-5 ${href ? 'group hover:border-gray-400 cursor-pointer transition-colors' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">{label}</p>
        {unlimited ? (
          <span className="text-xs text-gray-400">Illimitato</span>
        ) : (
          <span className="text-xs text-gray-500 font-mono">
            {fmt(used)} / {fmt(limit)}
          </span>
        )}
      </div>

      {!unlimited && (
        <div className="h-1.5 bg-gray-100 w-full overflow-hidden">
          <motion.div
            className={`h-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <p className="text-xl font-bold tabular-nums text-gray-900">{fmt(used)}</p>
        {!unlimited && (
          <p className={`text-xs font-medium ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-gray-400'}`}>
            {pct.toFixed(0)}%
          </p>
        )}
      </div>
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
