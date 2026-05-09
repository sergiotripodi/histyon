'use client'

import { motion } from 'framer-motion'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
}

function buildLinePath(data: number[], w: number, h: number): string {
  if (data.length < 2) return ''
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const pad = 2
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = pad + (h - pad * 2) * (1 - (v - min) / range)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function buildAreaPath(data: number[], w: number, h: number): string {
  const line = buildLinePath(data, w, h)
  if (!line) return ''
  return `${line} L ${w} ${h} L 0 ${h} Z`
}

export function Sparkline({ data, width = 100, height = 36, className }: SparklineProps) {
  const id = `sg-${Math.random().toString(36).slice(2, 7)}`
  const line = buildLinePath(data, width, height)
  const area = buildAreaPath(data, width, height)

  if (!line) {
    return <svg width={width} height={height} className={className} />
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111111" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#111111" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <motion.path
        d={area}
        fill={`url(#${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      />

      {/* Line */}
      <motion.path
        d={line}
        fill="none"
        stroke="#111111"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.3, ease: 'easeOut' }}
      />

      {/* Dot at end */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1]
        const max = Math.max(...data, 1)
        const min = Math.min(...data)
        const range = max - min || 1
        const pad = 2
        const cx = width
        const cy = pad + (height - pad * 2) * (1 - (last - min) / range)
        return (
          <motion.circle
            cx={cx}
            cy={cy}
            r="2.5"
            fill="#111111"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.4 }}
          />
        )
      })()}
    </svg>
  )
}
