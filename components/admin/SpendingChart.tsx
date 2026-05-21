'use client'

import { useState, useRef, useEffect } from 'react'

type ServiceKey = 'vercel' | 'supabase' | 'resend'

export interface MonthSpend {
  month: string   // 'YYYY-MM'
  vercel: number
  supabase: number
  resend: number
}

interface SpendingChartProps {
  data: MonthSpend[]
}

const COLORS: Record<ServiceKey, string> = {
  vercel:   '#111827',
  supabase: '#3ECF8E',
  resend:   '#6366F1',
}

const LABELS: Record<ServiceKey, string> = {
  vercel:   'Vercel',
  supabase: 'Supabase',
  resend:   'Resend',
}

const ALL: ServiceKey[] = ['vercel', 'supabase', 'resend']

const CHART_H = 160
const LEFT    = 44
const BOT     = 28
const RIGHT   = 16

export function SpendingChart({ data }: SpendingChartProps) {
  const [active, setActive] = useState<Set<ServiceKey>>(new Set(ALL))
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(600)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setChartWidth(el.clientWidth)
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  function toggle(s: ServiceKey) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(s)) {
        if (next.size > 1) next.delete(s)
      } else {
        next.add(s)
      }
      return next
    })
  }

  const isAllActive = active.size === ALL.length
  const plotW = chartWidth - LEFT - RIGHT
  const n = data.length

  // Max value across all visible series
  const maxVal = Math.max(
    ...data.flatMap(m => ALL.filter(s => active.has(s)).map(s => m[s])),
    1,
  )

  // X position for month i
  function xOf(i: number) {
    if (n <= 1) return LEFT + plotW / 2
    return LEFT + (i / (n - 1)) * plotW
  }

  // Y position for value v
  function yOf(v: number) {
    return CHART_H - (v / maxVal) * CHART_H
  }

  const ySteps = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActive(new Set(ALL))}
          className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
            isAllActive
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          Tutti
        </button>
        {ALL.map(s => {
          const isOn = active.has(s)
          return (
            <button
              key={s}
              onClick={() => toggle(s)}
              className={`px-3 py-1.5 text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                isOn
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              <span
                className="w-2 h-2 shrink-0"
                style={{
                  background: isOn ? COLORS[s] : '#d1d5db',
                  outline: isOn && s === 'vercel' ? '1.5px solid rgba(255,255,255,0.45)' : undefined,
                }}
              />
              {LABELS[s]}
            </button>
          )
        })}
      </div>

      {/* SVG line chart */}
      <div ref={containerRef} className="w-full">
        <svg width={chartWidth} height={CHART_H + BOT} className="block overflow-visible">

          {/* Grid + Y axis labels */}
          {ySteps.map(pct => {
            const y = CHART_H - pct * CHART_H
            const val = pct * maxVal
            return (
              <g key={pct}>
                <line
                  x1={LEFT} y1={y} x2={chartWidth - RIGHT} y2={y}
                  stroke={pct === 0 ? '#e5e7eb' : '#f3f4f6'}
                  strokeWidth={1}
                />
                <text
                  x={LEFT - 6} y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill="#9ca3af"
                  fontFamily="ui-monospace, monospace"
                >
                  ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}
                </text>
              </g>
            )
          })}

          {/* X axis month labels */}
          {data.map((m, i) => {
            // show fewer labels if crowded
            const step = n > 18 ? 3 : n > 9 ? 2 : 1
            if (i % step !== 0 && i !== n - 1) return null
            const raw = new Date(m.month + '-02').toLocaleDateString('it-IT', { month: 'short' })
            const label = raw.replace('.', '').replace(/^\w/, c => c.toUpperCase())
            return (
              <text
                key={m.month}
                x={xOf(i)}
                y={CHART_H + 17}
                textAnchor="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {label}
              </text>
            )
          })}

          {/* Lines per service */}
          {ALL.filter(s => active.has(s)).map(s => {
            const points = data.map((m, i) => `${xOf(i).toFixed(1)},${yOf(m[s]).toFixed(1)}`).join(' ')
            return (
              <polyline
                key={s}
                points={points}
                fill="none"
                stroke={COLORS[s]}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )
          })}

          {/* Dots per service */}
          {ALL.filter(s => active.has(s)).map(s =>
            data.map((m, i) => (
              <g key={`${s}-${m.month}`}>
                <title>{LABELS[s]}: ${m[s].toFixed(2)} — {new Date(m.month + '-02').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</title>
                {/* Hit area invisibile */}
                <circle cx={xOf(i)} cy={yOf(m[s])} r={8} fill="transparent" />
                {/* Dot visibile */}
                <circle
                  cx={xOf(i)}
                  cy={yOf(m[s])}
                  r={n <= 3 ? 4 : 3}
                  fill={COLORS[s]}
                  stroke="white"
                  strokeWidth={1.5}
                />
              </g>
            ))
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4">
        {ALL.filter(s => active.has(s)).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="w-5 h-[2px] shrink-0"
              style={{ background: COLORS[s] }}
            />
            <span className="text-[10px] text-gray-500">{LABELS[s]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
