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
  const honeypot = formData.get('website') as string | null
  if (honeypot) redirect('/auth/login?error=bot_detected')

  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) redirect('/auth/login?error=invalid_credentials')

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  revalidatePath('/', 'layout')

  if (aal?.nextLevel === 'aal2') {
    redirect('/auth/mfa-challenge')
  }
  redirect('/auth/mfa-setup')
}

// ── MFA actions ───────────────────────────────────────────────────────────────

export async function mfaEnroll(): Promise<{ factorId?: string; qrCode?: string; secret?: string; alreadyEnrolled?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autenticato' }

  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Use admin API to bypass JWT cache and get the real factor list from DB
  const { data: adminData } = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: user.id })
  const allFactors = (adminData as any)?.factors ?? []

  const verified = allFactors.find((f: any) => f.factor_type === 'totp' && f.status === 'verified')
  if (verified) return { alreadyEnrolled: true }

  // Delete all unverified TOTP factors directly via admin (no JWT dependency)
  for (const f of allFactors) {
    if (f.factor_type === 'totp') {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({ userId: user.id, id: f.id })
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'Histyon',
  })
  if (error) return { error: error.message }
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
}

export async function mfaVerifyEnrollment(factorId: string, code: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: challenge, error: ce } = await supabase.auth.mfa.challenge({ factorId })
  if (ce) return { error: 'Impossibile creare la verifica. Riprova.' }
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() })
  if (error) return { error: 'Codice non valido. Riprova.' }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function mfaGetChallenge(): Promise<{ factorId?: string; challengeId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const totp = factors?.totp?.[0]
  if (!totp) return { error: 'Nessun fattore MFA trovato' }
  const { data: challenge, error } = await supabase.auth.mfa.challenge({ factorId: totp.id })
  if (error) return { error: error.message }
  return { factorId: totp.id, challengeId: challenge.id }
}

export async function mfaVerifyLogin(factorId: string, challengeId: string, code: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code: code.trim() })
  if (error) return { error: 'Codice non valido. Riprova.' }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signup(prevState: SignupState, formData: FormData): Promise<SignupState> {
  const honeypot = formData.get('website') as string | null
  if (honeypot) return { status: 'error', message: 'Registrazione non valida.' }

  const termsAccepted = formData.get('accept_terms_privacy') === 'on'
  if (!termsAccepted) return { status: 'error', message: 'Devi accettare i Termini di Servizio e la Privacy Policy per continuare.' }

  const marketingConsent = formData.get('marketing_consent') === 'on'
  const consentTimestamp = new Date().toISOString()

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
    const issue = validated.error.issues[0]
    const field = issue?.path[0] ? ` (${String(issue.path[0])})` : ''
    return {
      status: 'error',
      message: (issue?.message || dictionary.validation.genericError) + field,
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
    console.error('[signup] auth.signUp error:', authError.status, authError.message)
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
        terms_accepted_at: consentTimestamp,
        privacy_accepted_at: consentTimestamp,
        marketing_consent: marketingConsent,
        marketing_consent_at: marketingConsent ? consentTimestamp : null,
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('[signup] profile update error:', profileError.code, profileError.message, profileError.details)
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

  redirect('/dashboard/home')
}
