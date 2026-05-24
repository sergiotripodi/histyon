'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'
import { Sparkline } from '@/components/dashboard/Sparkline'
import { ArrowRight } from 'lucide-react'

interface AdminStatCardProps {
  label: string
  value: number
  sparkline?: number[]
  subtitle?: string
  format?: 'number' | 'bytes' | 'currency'
  href?: string
}

function makeBytesFormatter(target: number): (v: number) => string {
  const { divisor, unit } =
    target >= 1e9 ? { divisor: 1e9, unit: 'GB' }
    : target >= 1e6 ? { divisor: 1e6, unit: 'MB' }
    : target >= 1e3 ? { divisor: 1e3, unit: 'KB' }
    : { divisor: 1, unit: 'B' }
  return (v: number) => `${(v / divisor).toFixed(1)} ${unit}`
}

function currencyFormatter(v: number): string {
  return `$${v.toFixed(2)}`
}

function numberFormatter(v: number): string {
  return Math.round(v).toLocaleString('it-IT')
}

export function AdminStatCard({ label, value, sparkline = [], subtitle, format = 'number', href }: AdminStatCardProps) {
  const formatter = useMemo(
    () =>
      format === 'bytes' ? makeBytesFormatter(value)
      : format === 'currency' ? currencyFormatter
      : numberFormatter,
    [format, value]
  )

  const motionVal = useMotionValue(0)
  const [display, setDisplay] = useState(formatter(0))

  useEffect(() => {
    const unsub = motionVal.on('change', v => setDisplay(formatter(v)))
    const ctrl = animate(motionVal, value, { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] })
    return () => { ctrl.stop(); unsub() }
  }, [value, formatter])

  const inner = (
    <div className={`h-full min-h-[154px] border border-gray-200 bg-white p-6 flex flex-col justify-between gap-5 transition-colors duration-200 ${href ? 'group hover:border-gray-400 cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 leading-tight">{label}</p>
        {href && <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 transition-colors shrink-0 mt-0.5" />}
      </div>

      <div className="flex items-end justify-between gap-3 min-w-0">
        <span className="text-3xl font-bold tracking-tight tabular-nums leading-none text-gray-900 truncate min-w-0">
          {display}
        </span>
        {sparkline.length > 0 && (
          <Sparkline data={sparkline} width={72} height={32} className="shrink-0" />
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-gray-400 leading-none border-t border-gray-100 pt-4 truncate">
          {subtitle}
        </p>
      )}
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
