'use client'

import { useRef, useTransition } from 'react'
import { setResendPlan } from '@/lib/actions/resend-plan'
import { RESEND_PLANS, type ResendPlanKey } from '@/lib/resend/plans'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function ResendPlanSelector({ currentPlan }: { currentPlan: ResendPlanKey }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  const handleChange = () => {
    startTransition(() => {
      if (formRef.current) {
        const formData = new FormData(formRef.current)
        setResendPlan(formData)
      }
    })
  }

  return (
    <form ref={formRef}>
      <div className="flex items-center gap-4">
        <select
          name="plan"
          defaultValue={currentPlan}
          onChange={handleChange}
          disabled={pending}
          className="border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-900 transition-colors disabled:opacity-50"
        >
          {Object.entries(RESEND_PLANS).map(([key, { label, price, quota }]) => (
            <option key={key} value={key}>
              {label} — ${price}/mese · {quota >= 1_000_000
                ? `${quota / 1_000_000}M`
                : quota >= 1_000 ? `${quota / 1_000}K` : quota} email
            </option>
          ))}
        </select>

        {pending
          ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          : <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvato
            </div>
        }
      </div>
    </form>
  )
}
