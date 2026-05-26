'use client'

import { useState, useRef, useEffect } from 'react'

interface ServiceCost {
  service: string
  cost: number
  color: string
}

interface CostBarChartProps {
  data: ServiceCost[]
  periodLabel: string
}

const BAR_W  = 72
const GAP    = 48
const CHART_H = 160
const LEFT   = 48
const BOT    = 28
const TOP    = 16

export function CostBarChart({ data, periodLabel }: CostBarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgW, setSvgW] = useState(400)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setSvgW(el.clientWidth)
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const max = Math.max(...data.map(d => d.cost), 1)
  const minNatural = LEFT + data.length * (BAR_W + GAP) - GAP + 24
  const totalW = Math.max(svgW, minNatural)

  // Distribute bars evenly across available width
  const plotW = totalW - LEFT - 24
  const barSpacing = data.length > 1 ? plotW / data.length : plotW
  const barX = (i: number) => LEFT + i * barSpacing + (barSpacing - BAR_W) / 2

  const ySteps = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="border border-gray-200 bg-white px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Costi per servizio
        </p>
        <span className="text-[10px] text-gray-300">{periodLabel}</span>
      </div>

      <div ref={containerRef} className="w-full">
        <svg
          width={totalW}
          height={CHART_H + BOT + TOP}
          className="block overflow-visible"
        >
          {/* Grid + Y labels */}
          {ySteps.map(pct => {
            const y = TOP + CHART_H - pct * CHART_H
            const val = pct * max
            return (
              <g key={pct}>
                <line
                  x1={LEFT} y1={y} x2={totalW - 8} y2={y}
                  stroke={pct === 0 ? '#e5e7eb' : '#f3f4f6'}
                  strokeWidth={1}
                />
                <text
                  x={LEFT - 6}
                  y={y + 4}
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
          {data.map((d, i) => {
            const barH = Math.max((d.cost / max) * CHART_H, d.cost > 0 ? 2 : 0)
            const x = barX(i)
            const y = TOP + CHART_H - barH
            const isHov = hovered === i
            const tooltipX = x + BAR_W / 2
            const tooltipY = y - 10
            const tooltipText = `$${d.cost.toFixed(2)}`
            const tooltipW = tooltipText.length * 7 + 16

            return (
              <g key={d.service}>
                <rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={barH}
                  fill={d.color}
                  opacity={hovered === null || isHov ? 1 : 0.35}
                  rx={2}
                  style={{ cursor: 'default', transition: 'opacity 0.15s' }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />

                {/* Tooltip */}
                {isHov && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect
                      x={tooltipX - tooltipW / 2}
                      y={tooltipY - 20}
                      width={tooltipW}
                      height={20}
                      fill="#111827"
                      rx={3}
                    />
                    <polygon
                      points={`${tooltipX - 5},${tooltipY} ${tooltipX + 5},${tooltipY} ${tooltipX},${tooltipY + 6}`}
                      fill="#111827"
                    />
                    <text
                      x={tooltipX}
                      y={tooltipY - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fill="white"
                      fontFamily="ui-monospace, monospace"
                      fontWeight="600"
                    >
                      {tooltipText}
                    </text>
                  </g>
                )}

                {/* X label */}
                <text
                  x={x + BAR_W / 2}
                  y={TOP + CHART_H + 17}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isHov ? '#111827' : '#9ca3af'}
                  style={{ transition: 'fill 0.15s' }}
                >
                  {d.service}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2">
        {data.map(d => (
          <div key={d.service} className="flex items-center gap-1.5">
            <span className="w-3 h-3 shrink-0" style={{ background: d.color }} />
            <span className="text-[10px] text-gray-500">{d.service}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
