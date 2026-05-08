'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { dictionary } from '@/lib/dictionary'

const optionalString = z.union([z.string(), z.null(), z.undefined(), z.literal('')])

const ProfileSchema = z.object({
  first_name: z.string().min(2, dictionary.validation.name),
  last_name: z.string().min(2, dictionary.validation.name),
  phone_number: optionalString,
  date_of_birth: optionalString,
  place_of_birth: optionalString,
  address_street: optionalString,
  address_civic: optionalString,
  postal_code: optionalString,
  city: optionalString,
  region: optionalString,
  country: optionalString,
  medical_license_number: optionalString,
  hospital_name: optionalString
})

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: dictionary.validation.unauthorized }

  const pPrefix = formData.get('phonePrefix')
  const pNum = formData.get('phone')
  const fullPhone = pNum ? `${pPrefix || '+39'} ${pNum}` : null

  const rawData = {
    first_name: formData.get('firstName'),
    last_name: formData.get('lastName'),
    phone_number: fullPhone,
    date_of_birth: formData.get('birth_date'),
    place_of_birth: formData.get('placeOfBirth'),
    address_street: formData.get('addressStreet'),
    address_civic: formData.get('addressCivic'),
    postal_code: formData.get('postalCode'),
    city: formData.get('city'),
    region: formData.get('region'),
    country: formData.get('country'),
    medical_license_number: formData.get('medicalLicense'),
    hospital_name: formData.get('hospitalName')
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

const EmailSchema = z.string().email(dictionary.validation.emailInvalid)
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
  const supabase = await createClient()
  const newPassword = formData.get('password') as string
  const confirm = formData.get('confirm_password') as string

  if (newPassword !== confirm) return { error: dictionary.validation.passwordMismatch }

  const valid = PasswordSchema.safeParse(newPassword)
  if (!valid.success) return { error: valid.error.issues[0].message }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: dictionary.validation.genericError }

  return { success: true, message: dictionary.auth.updatePassword.success }
}
