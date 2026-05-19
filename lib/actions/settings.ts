'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { dictionary } from '@/lib/dictionary'
import { deleteSupabasePrefix, INPUT_BUCKET, DZI_BUCKET } from '@/lib/storage/supabase'
import { sendAccountDeletedEmail } from '@/lib/email'

const optionalString = z.union([z.string(), z.null(), z.undefined(), z.literal('')])

const ProfileSchema = z.object({
  first_name:             z.string().min(2, dictionary.validation.name),
  last_name:              z.string().min(2, dictionary.validation.name),
  phone_number:           optionalString,
  date_of_birth:          optionalString,
  place_of_birth:         optionalString,
  address_street:         optionalString,
  address_civic:          optionalString,
  postal_code:            optionalString,
  city:                   optionalString,
  region:                 optionalString,
  country:                optionalString,
  medical_license_number: optionalString,
  hospital_name:          optionalString,
})

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
    console.error('Supabase DB error:', error.message)
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
  .min(8, dictionary.validation.passwordLength)
  .regex(/[A-Z]/, dictionary.validation.passwordComplexity)
  .regex(/[0-9]/, dictionary.validation.passwordComplexity)
  .regex(/[^a-zA-Z0-9]/, dictionary.validation.passwordSpecial)

export async function updateEmail(formData: FormData) {
  const supabase = await createClient()
  const newEmail = formData.get('email') as string

  const valid = EmailSchema.safeParse(newEmail)
  if (!valid.success) return { error: valid.error.issues[0].message }

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

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: dictionary.validation.genericError }

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

  // Elimina tutti i file dell'utente da Supabase Storage
  const prefix = user.id
  try {
    await Promise.all([
      deleteSupabasePrefix(INPUT_BUCKET, prefix),
      deleteSupabasePrefix(DZI_BUCKET,   prefix),
    ])
  } catch (err) {
    console.error('deleteAccount storage cleanup:', err)
  }

  // Elimina i record DB in cascata
  await supabase.from('tickets').delete().eq('doctor_id', user.id)
  await supabase.from('patients').delete().eq('doctor_id', user.id)
  await supabase.from('profiles').delete().eq('id', user.id)

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('deleteAccount auth.admin.deleteUser:', deleteError)
    return { error: dictionary.validation.genericError }
  }

  sendAccountDeletedEmail(user.email!, profile?.last_name ?? '').catch(console.error)

  await supabase.auth.signOut()
  redirect('/auth/account-deleted')
}
