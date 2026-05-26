'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { dictionary } from '@/lib/dictionary'
import { deleteSupabasePrefix, storagePaths } from '@/lib/storage/supabase'
import { sendAccountDeletedEmail, sendPasswordChangedEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { ProfileSchema } from '@/lib/schemas'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: dictionary.validation.unauthorized }

  const pPrefix = formData.get('phonePrefix')
  const pNum    = formData.get('phone')
  const fullPhone = pNum ? `${pPrefix || '+39'} ${pNum}` : null

  const rawData = {
    first_name:             formData.get('firstName'),
    last_name:              formData.get('lastName'),
    phone_number:           fullPhone,
    date_of_birth:          formData.get('birth_date'),
    place_of_birth:         formData.get('placeOfBirth'),
    address_street:         formData.get('addressStreet'),
    address_civic:          formData.get('addressCivic'),
    postal_code:            formData.get('postalCode'),
    city:                   formData.get('city'),
    region:                 formData.get('region'),
    country:                formData.get('country'),
    medical_license_number: formData.get('medicalLicense'),
    hospital_name:          formData.get('hospitalName'),
  }

  const validated = ProfileSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const finalUpdateData = Object.fromEntries(
    Object.entries(validated.data).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { data, error } = await supabase
    .from('profiles')
    .update(finalUpdateData)
    .eq('id', user.id)
    .select()

  if (error) {
    logger.error('updateProfile: DB update failed', { userId: user.id, code: error.code })
    return { error: dictionary.validation.genericError }
  }

  if (!data || data.length === 0) {
    return { error: dictionary.validation.genericError }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true, message: dictionary.dashboard.settings.form.success }
}

const EmailSchema    = z.string().email(dictionary.validation.emailInvalid)
const PasswordSchema = z.string()
  .min(8,                dictionary.validation.passwordLength)
  .regex(/[A-Z]/,        dictionary.validation.passwordComplexity)
  .regex(/[0-9]/,        dictionary.validation.passwordComplexity)
  .regex(/[^a-zA-Z0-9]/, dictionary.validation.passwordSpecial)

export async function updateEmail(formData: FormData) {
  const supabase  = await createClient()
  const newEmail  = formData.get('email') as string
  const cookieStore = await cookies()

  const valid = EmailSchema.safeParse(newEmail)
  if (!valid.success) return { error: valid.error.issues[0].message }

  // Salva la vecchia email in un cookie — la usiamo nel callback per la notifica
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (currentUser?.email) {
    cookieStore.set('histyon_old_email', currentUser.email, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24, // 24h, poi decade da solo
      path:     '/',
    })
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) return { error: dictionary.validation.genericError }

  return { success: true, message: dictionary.validation.linkSent }
}

export async function updatePassword(formData: FormData) {
  const supabase  = await createClient()
  const newPassword = formData.get('password') as string
  const confirm   = formData.get('confirm_password') as string

  if (newPassword !== confirm) return { error: dictionary.validation.passwordMismatch }

  const valid = PasswordSchema.safeParse(newPassword)
  if (!valid.success) return { error: valid.error.issues[0].message }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: dictionary.validation.genericError }

  if (currentUser?.email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_name')
      .eq('id', currentUser.id)
      .single()
    sendPasswordChangedEmail(currentUser.email, profile?.last_name ?? '')
      .catch(err => logger.warn('updatePassword: email failed', { err }))
  }

  return { success: true, message: dictionary.auth.updatePassword.success }
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  const password = formData.get('password') as string
  if (!password) return { error: dictionary.validation.required }

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  })
  if (authError) return { error: dictionary.validation.passwordWrong }

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_name')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()

  // Delete storage files (non-blocking — DB cleanup proceeds regardless)
  try {
    await Promise.all([
      deleteSupabasePrefix(storagePaths.inputDir(user.id)),
      deleteSupabasePrefix(storagePaths.dziDir(user.id)),
    ])
  } catch (err) {
    logger.error('deleteAccount: storage cleanup failed', { userId: user.id, err: String(err) })
  }

  // Atomic DB deletion via SECURITY DEFINER RPC (egress_logs + tickets + patients + profiles)
  const { error: rpcError } = await admin.rpc('delete_doctor_data', { p_doctor_id: user.id })
  if (rpcError) {
    logger.error('deleteAccount: delete_doctor_data RPC failed', { userId: user.id, code: rpcError.code, msg: rpcError.message })
    return { error: dictionary.validation.genericError }
  }

  // Remove the auth.users record last (auth is the source of truth for identity)
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    logger.error('deleteAccount: auth.admin.deleteUser failed', { userId: user.id, msg: deleteError.message })
    return { error: dictionary.validation.genericError }
  }

  sendAccountDeletedEmail(user.email!, profile?.last_name ?? '')
    .catch(err => logger.warn('deleteAccount: email failed', { err }))

  await supabase.auth.signOut()
  redirect('/auth/account-deleted')
}
