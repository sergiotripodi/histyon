'use server'

import { cookies } from 'next/headers'
import { RESEND_PLANS, type ResendPlanKey } from '@/lib/resend/plans'

export async function setResendPlan(formData: FormData) {
  const plan = formData.get('plan')?.toString() ?? 'free'
  if (!(plan in RESEND_PLANS)) return

  const cookieStore = await cookies()
  cookieStore.set('resend_plan', plan as ResendPlanKey, {
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 anni
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: false,
  })
}
