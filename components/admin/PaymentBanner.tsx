'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'
import { ArrowRight, CreditCard } from 'lucide-react'

interface PaymentBannerProps {
  monthlyRecurring: number
  historicalTotal: number
}

export function PaymentBanner({ monthlyRecurring, historicalTotal }: PaymentBannerProps) {
  const motionMonthly = useMotionValue(0)
  const motionTotal   = useMotionValue(0)
  const [displayMonthly, setDisplayMonthly] = useState('$0.00')
  const [displayTotal,   setDisplayTotal]   = useState('$0.00')

  useEffect(() => {
    const u1 = motionMonthly.on('change', v => setDisplayMonthly(`$${v.toFixed(2)}`))
    const u2 = motionTotal.on('change',   v => setDisplayTotal(`$${v.toFixed(2)}`))
    const c1 = animate(motionMonthly, monthlyRecurring, { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] })
    const c2 = animate(motionTotal,   historicalTotal,  { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] })
    return () => { c1.stop(); c2.stop(); u1(); u2() }
  }, [monthlyRecurring, historicalTotal])

  return (
    <Link href="/ops-histyon-console/dashboard/payments" className="block group mb-8">
      <div className="border border-gray-200 bg-white hover:border-gray-400 transition-colors duration-200">
        <div className="px-6 py-5 flex items-center justify-between gap-8">

          {/* Icona */}
          <div className="w-10 h-10 border border-gray-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-gray-600" />
          </div>

          {/* Costi mese corrente */}
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-0.5">
              Costi mese corrente
            </p>
            <p className="text-2xl font-bold tabular-nums text-gray-900 leading-none">
              {displayMonthly}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Vercel + Supabase + Resend</p>
          </div>

          <div className="h-10 w-px bg-gray-100 shrink-0" />

          {/* Totale storico */}
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-0.5">
              Totale storico Histyon
            </p>
            <p className="text-2xl font-bold tabular-nums text-gray-900 leading-none">
              {displayTotal}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Spesa cumulata dall&apos;avvio</p>
          </div>

          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
        </div>
      </div>
    </Link>
  )
}
