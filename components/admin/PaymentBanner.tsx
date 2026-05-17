'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'
import { ArrowRight, CreditCard } from 'lucide-react'

interface PaymentBannerProps {
  totalAccrued: number
  totalSpentAllTime: number
  nextPaymentDate: string | null
  nextPaymentAmount: number
  nextPaymentLabel: string | null
}

export function PaymentBanner({
  totalAccrued,
  totalSpentAllTime,
  nextPaymentDate,
  nextPaymentAmount,
  nextPaymentLabel,
}: PaymentBannerProps) {
  const motionAccrued = useMotionValue(0)
  const motionAllTime = useMotionValue(0)
  const [displayAccrued, setDisplayAccrued] = useState('$0.00')
  const [displayAllTime, setDisplayAllTime] = useState('$0.00')

  useEffect(() => {
    const u1 = motionAccrued.on('change', v => setDisplayAccrued(`$${v.toFixed(2)}`))
    const u2 = motionAllTime.on('change', v => setDisplayAllTime(`$${v.toFixed(2)}`))
    const c1 = animate(motionAccrued, totalAccrued, { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] })
    const c2 = animate(motionAllTime, totalSpentAllTime, { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] })
    return () => { c1.stop(); c2.stop(); u1(); u2() }
  }, [totalAccrued, totalSpentAllTime])

  return (
    <Link href="/ops-histyon-console/dashboard/payments" className="block group">
      <div className="border border-gray-200 bg-white hover:border-gray-400 transition-colors duration-200">
        <div className="px-6 py-5 flex items-center justify-between gap-8">

          {/* Main: accrued */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-gray-200 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-0.5">
                Costi accumulati
              </p>
              <p className="text-2xl font-bold tabular-nums text-gray-900 leading-none">
                {displayAccrued}
              </p>
            </div>
          </div>

          <div className="h-10 w-px bg-gray-100 shrink-0" />

          {/* All-time spend */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-0.5">
              Spesa totale storica
            </p>
            <p className="text-base font-semibold tabular-nums text-gray-600 leading-none">
              {displayAllTime}
            </p>
          </div>

          <div className="h-10 w-px bg-gray-100 shrink-0" />

          {/* Next payment */}
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 mb-0.5">
              Prossimo pagamento
            </p>
            {nextPaymentDate ? (
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {nextPaymentLabel ?? 'Scadenza'} — <span className="font-bold">${nextPaymentAmount.toFixed(2)}</span>
                <span className="text-gray-400 font-normal ml-2 text-xs">{nextPaymentDate}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400">Nessun pagamento pianificato</p>
            )}
          </div>

          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
        </div>
      </div>
    </Link>
  )
}
