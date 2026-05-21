'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { setResendPlan } from '@/lib/actions/resend-plan'
import { RESEND_PLANS, type ResendPlanKey } from '@/lib/resend/plans'
import { ChevronDown, Check, Loader2 } from 'lucide-react'

function fmtQuota(q: number): string {
  if (q >= 1_000_000) return `${q / 1_000_000}M email`
  if (q >= 1_000) return `${q / 1_000}K email`
  return `${q} email`
}

export function ResendPlanSelector({ currentPlan }: { currentPlan: ResendPlanKey }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ResendPlanKey>(currentPlan)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (key: ResendPlanKey) => {
    if (key === selected) { setOpen(false); return }
    setSelected(key)
    setOpen(false)
    startTransition(() => {
      const fd = new FormData()
      fd.set('plan', key)
      setResendPlan(fd)
    })
  }

  const plan = RESEND_PLANS[selected]

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={pending}
        className="flex items-center justify-between gap-8 min-w-[320px] border border-gray-200 bg-white px-4 py-3 text-sm text-left hover:border-gray-900 focus:outline-none focus:border-gray-900 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{plan.label}</span>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            ${plan.price}/mese · {fmtQuota(plan.quota)}
          </span>
        </div>
        <div className="shrink-0 text-gray-400">
          {pending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
          }
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-px z-50 min-w-[320px] border border-gray-200 bg-white shadow-sm">
          {Object.entries(RESEND_PLANS).map(([key, p]) => {
            const isActive = key === selected
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key as ResendPlanKey)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {p.label}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                    ${p.price}/mese · {fmtQuota(p.quota)}
                  </span>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-gray-900 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
