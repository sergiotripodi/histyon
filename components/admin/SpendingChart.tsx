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

// Colore del pallino nei filtri quando il bottone è attivo (bianco su grigio-900)
// Vercel è nero → invisibile su bg-gray-900, quindi usiamo bianco per tutti gli attivi
const DOT_COLOR_INACTIVE: Record<ServiceKey, string> = {
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
const GAP     = 8   // gap tra barre

export function SpendingChart({ data }: SpendingChartProps) {
  const [active, setActive] = useState<Set<ServiceKey>>(new Set(ALL))
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(600)

  // Responsivo: aggiorna la larghezza al resize del container
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

  // Larghezza barra calcolata in base alla larghezza disponibile
  const n = data.length || 1
  const plotW = chartWidth - LEFT - 8
  const BAR_W = Math.max(8, Math.floor((plotW - GAP * (n - 1)) / n))

  const maxTotal = Math.max(
    ...data.map(m => ALL.filter(s => active.has(s)).reduce((sum, s) => sum + m[s], 0)),
    1,
  )

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
                className="w-2 h-2 shrink-0 ring-1 ring-white/20"
                style={{ background: isOn ? DOT_COLOR_INACTIVE[s] : '#d1d5db',
                  // Vercel attivo: bordo bianco per distinguerlo dal bg nero
                  outline: isOn && s === 'vercel' ? '1.5px solid rgba(255,255,255,0.5)' : undefined }}
              />
              {LABELS[s]}
            </button>
          )
        })}
      </div>

      {/* SVG chart — full width */}
      <div ref={containerRef} className="w-full">
        <svg
          width={chartWidth}
          height={CHART_H + BOT}
          className="block overflow-visible"
        >
          {/* Grid + Y labels */}
          {ySteps.map(pct => {
            const y = CHART_H - pct * CHART_H
            const val = pct * maxTotal
            return (
              <g key={pct}>
                <line
                  x1={LEFT - 4} y1={y}
                  x2={chartWidth - 4} y2={y}
                  stroke="#f3f4f6" strokeWidth={1}
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

          {/* Bars */}
          {data.map((m, i) => {
            const barX = LEFT + i * (BAR_W + GAP)
            const activeServices = ALL.filter(s => active.has(s))

            let stackY = CHART_H
            const segments = activeServices.map(s => {
              const h = maxTotal > 0 ? (m[s] / maxTotal) * CHART_H : 0
              const segY = stackY - h
              stackY -= h
              return { s, y: segY, h }
            })

            const raw = new Date(m.month + '-02').toLocaleDateString('it-IT', { month: 'short' })
            const labelCap = raw.replace('.', '').replace(/^\w/, c => c.toUpperCase())
            const total = activeServices.reduce((sum, s) => sum + m[s], 0)

            return (
              <g key={m.month}>
                <title>${total.toFixed(2)} — {labelCap}</title>
                {segments.map(seg => (
                  <rect
                    key={seg.s}
                    x={barX}
                    y={seg.y}
                    width={BAR_W}
                    height={seg.h}
                    fill={COLORS[seg.s]}
                  />
                ))}
                <text
                  x={barX + BAR_W / 2}
                  y={CHART_H + 17}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9ca3af"
                >
                  {labelCap}
                </text>
              </g>
            )
          })}

          {/* Baseline */}
          <line
            x1={LEFT - 4} y1={CHART_H}
            x2={chartWidth - 4} y2={CHART_H}
            stroke="#e5e7eb" strokeWidth={1}
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4">
        {ALL.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 shrink-0 border border-gray-200" style={{ background: COLORS[s] }} />
            <span className="text-[10px] text-gray-500">{LABELS[s]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
