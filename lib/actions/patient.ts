'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { dictionary } from '@/lib/dictionary'
import { PatientSchema } from '@/lib/schemas'
import { deleteSupabasePrefix, deleteSupabaseFiles, storagePaths } from '@/lib/storage/supabase'
import { logger } from '@/lib/logger'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function addPatient(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  const day   = formData.get('dob_day')
  const month = formData.get('dob_month')
  const year  = formData.get('dob_year')
  const fullDob = `${year}-${month}-${day}`

  const phonePrefix = formData.get('phonePrefix')
  const phoneNum    = formData.get('phone')
  const fullPhone   = phoneNum ? `${phonePrefix || '+39'} ${phoneNum}` : formData.get('phoneNumber')

  const rawData = {
    firstName:    formData.get('firstName'),
    lastName:     formData.get('lastName'),
    fiscalCode:   (formData.get('fiscalCode') as string)?.toUpperCase(),
    dob:          fullDob,
    gender:       formData.get('gender'),
    country:      formData.get('country')       || undefined,
    placeOfBirth: formData.get('placeOfBirth')  || undefined,
    addressStreet: formData.get('addressStreet') || undefined,
    addressCivic:  formData.get('addressCivic')  || undefined,
    city:         formData.get('city')           || undefined,
    province:     formData.get('region')         || undefined,
    postalCode:   formData.get('postalCode')     || undefined,
    email:        formData.get('email')          || '',
    phone:        fullPhone                      || undefined,
  }

  const validated = PatientSchema.safeParse(rawData)
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { data: existing } = await supabase
    .from('patients')
    .select('id')
    .eq('doctor_id', user.id)
    .eq('fiscal_code', validated.data.fiscalCode)
    .single()

  if (existing) return { error: dictionary.validation.patientExists }

  const { error } = await supabase.from('patients').insert({
    doctor_id:     user.id,
    first_name:    validated.data.firstName,
    last_name:     validated.data.lastName,
    fiscal_code:   validated.data.fiscalCode,
    date_of_birth: validated.data.dob,
    gender:        validated.data.gender,
    country:       validated.data.country,
    place_of_birth: validated.data.placeOfBirth,
    address_street: validated.data.addressStreet,
    address_civic:  validated.data.addressCivic,
    city:          validated.data.city,
    province:      validated.data.province,
    postal_code:   validated.data.postalCode,
    email:         validated.data.email,
    phone_number:  validated.data.phone,
  })

  if (error) {
    logger.error('addPatient', { code: error.code, msg: error.message })
    return { error: dictionary.validation.genericError }
  }

  revalidatePath('/dashboard/patients')
  return { success: true }
}

export async function deleteTicket(ticketId: string) {
  if (!UUID_RE.test(ticketId)) return { error: dictionary.validation.genericError }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, doctor_id, patient_id')
    .eq('id', ticketId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!ticket) return { error: dictionary.validation.unauthorized }

  const p = ticket.patient_id
  try {
    await Promise.all([
      deleteSupabaseFiles([storagePaths.input(user.id, p, ticketId)]),
      deleteSupabaseFiles([storagePaths.dzi(user.id, p, ticketId)]),
      deleteSupabasePrefix(storagePaths.dziFiles(user.id, p, ticketId)),
    ])
  } catch (err) {
    logger.warn('deleteTicket: storage cleanup partial failure', { ticketId, err })
  }

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
    .eq('doctor_id', user.id)

  if (error) {
    logger.error('deleteTicket: DB delete failed', { ticketId, code: error.code })
    return { error: dictionary.validation.genericError }
  }

  revalidatePath('/dashboard/patients')
  revalidatePath('/dashboard/home')
  return { success: true }
}

export async function deletePatient(patientId: string) {
  if (!UUID_RE.test(patientId)) return { error: dictionary.validation.genericError }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!patient) return { error: dictionary.validation.unauthorized }

  // Storage cleanup is best-effort — DB deletion is atomic via RPC regardless
  try {
    await Promise.all([
      deleteSupabasePrefix(storagePaths.inputDir(user.id, patientId)),
      deleteSupabasePrefix(storagePaths.dziDir(user.id, patientId)),
    ])
  } catch (err) {
    logger.warn('deletePatient: storage cleanup partial failure', { patientId, err })
  }

  // Single transactional RPC: deletes egress_logs → tickets → patient atomically
  const { error } = await supabase.rpc('delete_patient_data', {
    p_doctor_id:  user.id,
    p_patient_id: patientId,
  })

  if (error) {
    logger.error('deletePatient: RPC failed', { patientId, code: error.code })
    return { error: dictionary.validation.genericError }
  }

  revalidatePath('/dashboard/patients')
  redirect('/dashboard/patients')
}
