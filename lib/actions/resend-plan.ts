'use server'

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { RESEND_PLANS, type ResendPlanKey } from '@/lib/resend/plans'

export async function setResendPlan(formData: FormData) {
  const plan = formData.get('plan')?.toString() ?? 'free'
  if (!(plan in RESEND_PLANS)) return

  // 1. Cookie (lettura rapida lato browser/server components)
  const cookieStore = await cookies()
  cookieStore.set('resend_plan', plan as ResendPlanKey, {
    maxAge: 60 * 60 * 24 * 365 * 10,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: false,
  })

  // 2. DB (lettura dal cron, che non ha accesso ai cookie)
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    await db
      .from('admin_settings')
      .upsert({ key: 'resend_plan', value: plan }, { onConflict: 'key' })
  } catch (err) {
    // Non blocca: il cookie è già stato impostato
    console.error('[setResendPlan] DB sync failed:', err)
  }
}
