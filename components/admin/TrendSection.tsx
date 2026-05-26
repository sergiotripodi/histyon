'use client'

import { useState } from 'react'
import { TimeChart } from '@/components/admin/TimeChart'

interface TrendSectionProps {
  usersChartData:    { label: string; value: number }[]
  analysesChartData: { label: string; value: number }[]
}

export function TrendSection({ usersChartData, analysesChartData }: TrendSectionProps) {
  const [active, setActive] = useState<'users' | 'analyses'>('users')
  const chartData = active === 'analyses' ? analysesChartData : usersChartData

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Trend</p>
        <div className="inline-flex border border-gray-200 bg-white">
          {([['users', 'Utenti'], ['analyses', 'Analisi']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                active === key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="border border-gray-200 bg-white p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-6">
          {active === 'analyses' ? 'Analisi effettuate per giorno' : 'Crescita utenti'} — ultimi 90 giorni
        </p>
        <TimeChart data={chartData} height={160} />
      </div>
    </>
  )
}
