'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminActivity } from '@/lib/audit'

const CONSOLE_PATH = '/tripo'

export async function adminLogin(formData: FormData) {
  const honeypot = formData.get('website') as string | null
  if (honeypot) redirect(`${CONSOLE_PATH}/login?error=invalid_credentials`)

  const supabase = await createClient()

  const email    = (formData.get('email') as string ?? '').trim().slice(0, 254)
  const password = (formData.get('password') as string ?? '').slice(0, 256)

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`${CONSOLE_PATH}/login?error=invalid_credentials`)

  // Verify this is actually an admin account before proceeding
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`${CONSOLE_PATH}/login?error=invalid_credentials`)

  const supabaseAdmin = createAdminClient()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    // Valid credentials but not an admin — sign out silently
    await supabase.auth.signOut()
    redirect(`${CONSOLE_PATH}/login?error=invalid_credentials`)
  }

  // Log successful admin login (fire-and-forget, before redirect)
  logAdminActivity(user.id, 'admin_login').catch(() => {})

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  revalidatePath('/', 'layout')

  if (aal?.nextLevel === 'aal2') {
    redirect(`${CONSOLE_PATH}/mfa-challenge`)
  }
  redirect(`${CONSOLE_PATH}/mfa-setup`)
}

export async function adminLogout() {
  const supabase = await createClient()
  // Log before signOut — after signOut getUser() returns null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) await logAdminActivity(user.id, 'admin_logout')
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(`${CONSOLE_PATH}/login`)
}

export async function adminMfaEnroll(): Promise<{
  factorId?: string
  qrCode?: string
  secret?: string
  alreadyEnrolled?: boolean
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autenticato' }

  const supabaseAdmin = createAdminClient()

  type MfaFactor = { id: string; factor_type: string; status: string }

  const { data: adminData } = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: user.id })
  const allFactors: MfaFactor[] = (adminData as { factors?: MfaFactor[] })?.factors ?? []
  const verified = allFactors.find(f => f.factor_type === 'totp' && f.status === 'verified')
  if (verified) return { alreadyEnrolled: true }

  for (const f of allFactors) {
    if (f.factor_type === 'totp') {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({ userId: user.id, id: f.id })
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Histyon Admin' })
  if (error) {
    await supabase.auth.signOut()
    return { error: error.message }
  }
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
}

export async function adminMfaVerifyEnrollment(
  factorId: string,
  code: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: challenge, error: ce } = await supabase.auth.mfa.challenge({ factorId })
  if (ce) return { error: 'Impossibile creare la verifica.' }
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() })
  if (error) {
    if (user) logAdminActivity(user.id, 'admin_mfa_enrolled', { success: false }).catch(() => {})
    return { error: 'Codice non valido.' }
  }
  if (user) logAdminActivity(user.id, 'admin_mfa_enrolled').catch(() => {})
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function adminMfaGetChallenge(): Promise<{
  factorId?: string
  challengeId?: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const totp = factors?.totp?.[0]
  if (!totp) {
    await supabase.auth.signOut()
    return { error: 'Nessun fattore MFA trovato' }
  }
  const { data: challenge, error } = await supabase.auth.mfa.challenge({ factorId: totp.id })
  if (error) {
    await supabase.auth.signOut()
    return { error: error.message }
  }
  return { factorId: totp.id, challengeId: challenge.id }
}

export async function adminMfaVerifyLogin(
  factorId: string,
  challengeId: string,
  code: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code: code.trim() })
  if (error) {
    if (user) logAdminActivity(user.id, 'admin_mfa_verified', { success: false }).catch(() => {})
    return { error: 'Codice non valido.' }
  }
  if (user) logAdminActivity(user.id, 'admin_mfa_verified').catch(() => {})
  revalidatePath('/', 'layout')
  return { success: true }
}
