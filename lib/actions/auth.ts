'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { DoctorRegistrationSchema, PasswordSchema } from '@/lib/schemas'
import { dictionary } from '@/lib/dictionary'
import { headers } from 'next/headers'

export type SignupState = {
  status: 'idle' | 'success' | 'error'
  errors?: { [key: string]: string }
  message?: string
  inputs?: Record<string, unknown>
}

async function resolveAppOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (env) return env
  const h = await headers()
  return h.get('origin') || ''
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) redirect('/auth/login?error=invalid_credentials')

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(prevState: SignupState, formData: FormData): Promise<SignupState> {
  const supabase = await createClient()
  const rawData = Object.fromEntries(formData)
  const password = formData.get('password') as string

  const passCheck = PasswordSchema.safeParse(password)
  if (!passCheck.success) {
    return {
      status: 'error',
      errors: { password: passCheck.error.issues[0].message },
      inputs: rawData,
    }
  }

  let fullDob = (formData.get('dob') as string) || ''

  if (!fullDob || fullDob.length < 10) {
    const day = formData.get('dob_day')
    const month = formData.get('dob_month')
    const year = formData.get('dob_year')

    if (!year || !month || !day) {
      return { status: 'error', message: dictionary.validation.required, inputs: rawData }
    }
    fullDob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const rawPhone = (formData.get('phone') as string | null)?.trim()
  const phoneForSchema = rawPhone && rawPhone.length > 0 ? rawPhone : undefined

  const candidate = {
    email: String(formData.get('email') || '')
      .trim()
      .toLowerCase(),
    password,
    firstName: String(formData.get('firstName') || '').trim(),
    lastName: String(formData.get('lastName') || '').trim(),
    fiscalCode: String(formData.get('fiscalCode') || '')
      .trim()
      .toUpperCase(),
    medicalLicense: String(formData.get('medicalLicense') || '').trim(),
    hospitalName: String(formData.get('hospitalName') || '').trim(),
    dob: fullDob,
    placeOfBirth: String(formData.get('placeOfBirth') || '').trim(),
    gender: formData.get('gender') as 'M' | 'F',
    addressStreet: String(formData.get('addressStreet') || '').trim(),
    addressCivic: String(formData.get('addressCivic') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    country: String(formData.get('country') || '').trim(),
    region: String(formData.get('region') || '').trim(),
    postalCode: String(formData.get('postalCode') || '').trim(),
    phone: phoneForSchema,
  }

  const validated = DoctorRegistrationSchema.safeParse(candidate)
  if (!validated.success) {
    return {
      status: 'error',
      message: validated.error.issues[0]?.message || dictionary.validation.genericError,
      inputs: rawData,
    }
  }

  const userData = validated.data
  const origin = await resolveAppOrigin()
  const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        fiscal_code: userData.fiscalCode,
        medical_license: userData.medicalLicense,
        hospital_name: userData.hospitalName,
        dob: userData.dob,
        place_of_birth: userData.placeOfBirth,
        gender: userData.gender,
        address_street: userData.addressStreet,
        address_civic: userData.addressCivic,
        city: userData.city,
        country: userData.country,
        region: userData.region,
        postal_code: userData.postalCode,
        phone: userData.phone ?? null,
      },
    },
  })

  if (authError) {
    const fieldErrors: Record<string, string> = {}
    if (authError.message.includes('already registered') || authError.status === 422) {
      fieldErrors.email = dictionary.validation.alreadyRegistered
    }
    return {
      status: 'error',
      message: dictionary.validation.genericError,
      errors: fieldErrors,
      inputs: rawData,
    }
  }

  if (authData.user) {
    const supabaseAdmin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        fiscal_code: userData.fiscalCode,
        hospital_name: userData.hospitalName,
        medical_license_number: userData.medicalLicense,
        date_of_birth: userData.dob,
        place_of_birth: userData.placeOfBirth,
        gender: userData.gender,
        address_street: userData.addressStreet,
        address_civic: userData.addressCivic,
        city: userData.city,
        country: userData.country,
        province: userData.region,
        region: userData.region,
        postal_code: userData.postalCode,
        phone_number: userData.phone ?? null,
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Errore creazione profilo:', profileError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { status: 'error', message: dictionary.validation.genericError, inputs: rawData }
    }
  }

  await supabase.auth.signOut()

  redirect('/auth/register/success')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = await resolveAppOrigin()
  const redirectTo = origin ? `${origin}/auth/callback?next=update-password` : undefined

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    ...(redirectTo ? { redirectTo } : {}),
  })

  if (error) {
    redirect('/auth/forgot-password?error=reset_failed')
  }

  const cookieStore = await cookies()
  cookieStore.set('histyon_auth_next', 'update-password', {
    maxAge: 600,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  redirect('/auth/forgot-password?success=true')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/auth/update-password?error=password_mismatch')
  }

  const passCheck = PasswordSchema.safeParse(password)
  if (!passCheck.success) {
    redirect('/auth/update-password?error=password_weak')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('same password') || msg.includes('different from')) {
      redirect('/auth/update-password?error=password_same')
    }
    redirect('/auth/update-password?error=password_update_failed')
  }

  redirect('/dashboard')
}
