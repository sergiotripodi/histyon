'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const optionalString = z.union([z.string(), z.null(), z.undefined(), z.literal('')])

const ProfileSchema = z.object({
  first_name: z.string().min(2, "Nome troppo corto"),
  last_name: z.string().min(2, "Cognome troppo corto"),
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

  if (!user) return { error: 'Non autorizzato' }

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
    console.error("Errore Validazione Zod:", validated.error.format())
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
    console.error('Errore Database Supabase:', error.message)
    return { error: "Impossibile salvare. Riprova più tardi." }
  }

  if (!data || data.length === 0) {
    console.warn("Nessun errore, ma nessuna riga aggiornata. Controlla l'ID utente.")
    return { error: "Errore nell'aggiornamento: profilo non trovato." }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true, message: 'Impostazioni salvate con successo!' }
}

const EmailSchema = z.string().email("Email non valida")
const PasswordSchema = z.string()
  .min(8, "Minimo 8 caratteri")
  .regex(/[A-Z]/, "Serve una maiuscola")
  .regex(/[0-9]/, "Serve un numero")
  .regex(/[^a-zA-Z0-9]/, "Serve un carattere speciale")

export async function updateEmail(formData: FormData) {
  const supabase = await createClient()
  const newEmail = formData.get('email') as string
  
  const valid = EmailSchema.safeParse(newEmail)
  if (!valid.success) return { error: valid.error.issues[0].message }

  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) return { error: 'Impossibile aggiornare l\'email. Riprova.' }

  return { success: true, message: 'Link di conferma inviato.' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const newPassword = formData.get('password') as string
  const confirm = formData.get('confirm_password') as string

  if (newPassword !== confirm) return { error: "Le password non coincidono." }

  const valid = PasswordSchema.safeParse(newPassword)
  if (!valid.success) return { error: valid.error.issues[0].message }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: 'Impossibile aggiornare la password. Riprova.' }

  return { success: true, message: 'Password aggiornata.' }
}




