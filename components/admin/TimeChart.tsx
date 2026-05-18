'use client'

import { motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'

interface TimeChartProps {
  data: { label: string; value: number }[]
  height?: number
  format?: 'number' | 'currency'
  className?: string
}

function fmtValue(v: number, format: 'number' | 'currency'): string {
  if (format === 'currency') return `$${v.toFixed(2)}`
  return Math.round(v).toLocaleString('it-IT')
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

function buildAreaPath(points: { x: number; y: number }[], h: number): string {
  const line = buildLinePath(points)
  if (!line || points.length < 2) return ''
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x} ${h} L ${first.x} ${h} Z`
}

export function TimeChart({ data, height = 120, format = 'number', className }: TimeChartProps) {
  const w = 800
  const svgH = height
  const pad = { top: 12, bottom: 12 }
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const max = Math.max(...data.map(d => d.value), 1)
  const range = max

  const points = useMemo(() => data.map((d, i) => ({
    x: data.length === 1 ? w / 2 : (i / (data.length - 1)) * w,
    y: pad.top + (svgH - pad.top - pad.bottom) * (1 - d.value / range),
  })), [data, svgH, range])

  const line = buildLinePath(points)
  const area = buildAreaPath(points, svgH - pad.bottom)

  const gradId = useMemo(
    () => `tch-grad-${data.length}-${Math.round(max * 100)}`,
    [data.length, max]
  )

  const labelStep = data.length > 14 ? Math.ceil(data.length / 7) : 1

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const idx = Math.min(data.length - 1, Math.max(0, Math.round(relX * (data.length - 1))))
    setHoverIdx(idx)
  }

  const hp = hoverIdx !== null ? points[hoverIdx] : null
  const hpLeftPct = hp ? (hp.x / w) * 100 : 0
  const hpTopPct = hp ? (hp.y / svgH) * 100 : 0

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Hover tooltip */}
      {hoverIdx !== null && hp && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: `${hpLeftPct}%`,
            top: `${hpTopPct}%`,
            transform: 'translate(-50%, calc(-100% - 8px))',
          }}
        >
          <div className="bg-gray-900 text-white text-[10px] px-2 py-1.5 whitespace-nowrap shadow-lg">
            <div className="font-bold tabular-nums">{fmtValue(data[hoverIdx].value, format)}</div>
            <div className="text-gray-400 mt-0.5">{data[hoverIdx].label}</div>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${svgH}`}
        preserveAspectRatio="none"
        className="w-full block cursor-crosshair"
        style={{ height: svgH }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#111" stopOpacity="0" />
          </linearGradient>
        </defs>

        {area && (
          <motion.path d={area} fill={`url(#${gradId})`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }} />
        )}
        {line && (
          <motion.path d={line} fill="none" stroke="#111" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }} />
        )}

        {/* Hover vertical line */}
        {hoverIdx !== null && hp && (
          <line
            x1={hp.x} y1={pad.top}
            x2={hp.x} y2={svgH - pad.bottom}
            stroke="#111" strokeWidth="1" strokeDasharray="3,3" opacity="0.35"
          />
        )}
      </svg>

      {/* Labels as HTML — no SVG stretching */}
      <div className="relative h-5 mt-1">
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null
          const leftPct = data.length === 1 ? 50 : (i / (data.length - 1)) * 100
          return (
            <span
              key={i}
              className="absolute text-[10px] text-gray-400 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${leftPct}%` }}
            >
              {d.label}
            </span>
          )
        })}
      </div>

      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-gray-300">0</span>
        <span className="text-[10px] text-gray-300">{fmtValue(max, format)}</span>
      </div>
    </div>
  )
}
