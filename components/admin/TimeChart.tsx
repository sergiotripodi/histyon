'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface TimeChartProps {
  data: { label: string; value: number }[]
  height?: number
  formatValue?: (v: number) => string
  className?: string
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
}

function buildAreaPath(points: { x: number; y: number }[], h: number): string {
  const line = buildLinePath(points)
  if (!line || points.length < 2) return ''
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x} ${h} L ${first.x} ${h} Z`
}

export function TimeChart({ data, height = 120, formatValue = (v) => v.toLocaleString('it-IT'), className }: TimeChartProps) {
  const w = 800
  const h = height
  const pad = { top: 12, bottom: 32, left: 0, right: 0 }

  const max = Math.max(...data.map(d => d.value), 1)
  const min = 0
  const range = max - min || 1

  const points = useMemo(() => data.map((d, i) => ({
    x: data.length === 1 ? w / 2 : (i / (data.length - 1)) * w,
    y: pad.top + (h - pad.top - pad.bottom) * (1 - (d.value - min) / range),
  })), [data, h, min, range])

  const line = buildLinePath(points)
  const area = buildAreaPath(points, h - pad.bottom)
  const gradId = 'tch-grad'

  // Show every nth label to avoid crowding
  const labelStep = data.length > 14 ? Math.ceil(data.length / 7) : 1

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#111" stopOpacity="0" />
          </linearGradient>
        </defs>

        {area && (
          <motion.path
            d={area}
            fill={`url(#${gradId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          />
        )}

        {line && (
          <motion.path
            d={line}
            fill="none"
            stroke="#111"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}

        {/* Data point dots */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
            stroke="#111"
            strokeWidth="1.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 1.0 + i * 0.03 }}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null
          const x = points[i]?.x ?? 0
          return (
            <text
              key={i}
              x={x}
              y={h - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
              fontFamily="inherit"
            >
              {d.label}
            </text>
          )
        })}
      </svg>

      {/* Y-axis reference */}
      <div className="flex justify-between mt-1 px-0">
        <span className="text-[10px] text-gray-300">0</span>
        <span className="text-[10px] text-gray-300">{formatValue(max)}</span>
      </div>
    </div>
  )
}
