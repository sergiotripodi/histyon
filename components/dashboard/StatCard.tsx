'use client'

import { useEffect, useMemo, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'
import { Sparkline } from './Sparkline'

interface StatCardProps {
  label: string
  value: number
  sparkline: number[]
  subtitle?: string
  format?: 'number' | 'bytes'
  accent?: 'default' | 'red'
}

function makeBytesFormatter(targetBytes: number): (v: number) => string {
  const { divisor, unit } =
    targetBytes >= 1e9
      ? { divisor: 1e9, unit: 'GB' }
      : targetBytes >= 1e6
      ? { divisor: 1e6, unit: 'MB' }
      : targetBytes >= 1e3
      ? { divisor: 1e3, unit: 'KB' }
      : { divisor: 1, unit: 'B' }
  return (v: number) => `${(v / divisor).toFixed(1)} ${unit}`
}

function numberFormatter(v: number): string {
  return Math.round(v).toLocaleString('it-IT')
}

export function StatCard({
  label,
  value,
  sparkline,
  subtitle,
  format = 'number',
  accent = 'default',
}: StatCardProps) {
  const formatter = useMemo(
    () => (format === 'bytes' ? makeBytesFormatter(value) : numberFormatter),
    [format, value]
  )

  const motionVal = useMotionValue(0)
  const [display, setDisplay] = useState(formatter(0))

  useEffect(() => {
    const unsubscribe = motionVal.on('change', (v) => setDisplay(formatter(v)))
    const controls = animate(motionVal, value, {
      duration: 1.4,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, formatter])

  return (
    <div className="border border-gray-200 bg-white p-6 flex flex-col gap-5 group hover:border-gray-400 transition-colors duration-200">
      <p
        className={`text-[10px] font-medium uppercase tracking-[0.14em] ${
          accent === 'red' ? 'text-red-400' : 'text-gray-400'
        }`}
      >
        {label}
      </p>

      <div className="flex items-end justify-between gap-3">
        <span
          className={`text-3xl font-bold tracking-tight tabular-nums leading-none ${
            accent === 'red' ? 'text-red-600' : 'text-gray-900'
          }`}
        >
          {display}
        </span>
        <Sparkline data={sparkline} width={88} height={32} className="shrink-0" />
      </div>

      {subtitle && (
        <p className="text-[11px] text-gray-400 leading-none border-t border-gray-100 pt-4">
          {subtitle}
        </p>
      )}
    </div>
  )
}
