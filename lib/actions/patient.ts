'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { dictionary } from '@/lib/dictionary'
import { REGEX_VALIDATORS } from '@/lib/constants'
import { r2Client } from '@/lib/storage/r2'
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function deleteR2Prefix(bucket: string, prefix: string) {
  let token: string | undefined
  do {
    const list = await r2Client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: token,
    }))
    const keys = (list.Contents ?? []).map(o => ({ Key: o.Key! })).filter(o => o.Key)
    if (keys.length > 0) {
      await r2Client.send(new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys, Quiet: true },
      }))
    }
    token = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (token)
}

const PatientSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  fiscalCode: z.string().length(16).regex(new RegExp(REGEX_VALIDATORS.FISCAL_CODE), dictionary.validation.fiscalCodeFormat),
  dob: z.string(),
  gender: z.enum(['M', 'F', 'OTHER']),
  country: z.string().optional(),
  placeOfBirth: z.string().optional(),
  
  addressStreet: z.string().optional(),
  addressCivic: z.string().optional(),
  
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  email: z.string().email(dictionary.validation.emailInvalid).or(z.literal('')),
  phoneNumber: z.string().min(5, dictionary.validation.phoneShort),
})

export async function addPatient(prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  const day = formData.get('dob_day')
  const month = formData.get('dob_month')
  const year = formData.get('dob_year')
  const fullDob = `${year}-${month}-${day}`

  const phonePrefix = formData.get('phonePrefix')
  const phoneNum = formData.get('phone')
  const fullPhone = phoneNum ? `${phonePrefix || '+39'} ${phoneNum}` : formData.get('phoneNumber')

  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    fiscalCode: (formData.get('fiscalCode') as string)?.toUpperCase(),
    dob: fullDob,
    gender: formData.get('gender'),
    country: formData.get('country') || undefined,
    placeOfBirth: formData.get('placeOfBirth') || undefined,
    
    addressStreet: formData.get('addressStreet') || undefined,
    addressCivic: formData.get('addressCivic') || undefined,
    
    city: formData.get('city') || undefined,
    province: formData.get('region') || undefined,
    postalCode: formData.get('postalCode') || undefined,
    email: formData.get('email') || '',
    phoneNumber: fullPhone || '',
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
    doctor_id: user.id,
    first_name: validated.data.firstName,
    last_name: validated.data.lastName,
    fiscal_code: validated.data.fiscalCode,
    date_of_birth: validated.data.dob,
    gender: validated.data.gender,
    country: validated.data.country,
    place_of_birth: validated.data.placeOfBirth,
    
    address_street: validated.data.addressStreet,
    address_civic: validated.data.addressCivic,
    
    city: validated.data.city,
    region: validated.data.province,
    postal_code: validated.data.postalCode,
    email: validated.data.email,
    phone_number: validated.data.phoneNumber
  })

  if (error) {
    console.error('addPatient:', error)
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

  // Fetch ticket to get file paths and verify ownership
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, doctor_id, patient_id, input_file, output_dzi, qupath_project, output_region')
    .eq('id', ticketId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!ticket) return { error: dictionary.validation.unauthorized }

  const inputBucket = process.env.R2_INPUT_BUCKET_NAME!
  const outputBucket = process.env.R2_OUTPUT_BUCKET_NAME!

  // Collect specific keys to delete (avoids touching other tickets in same patient folder)
  const inputKeys = [ticket.input_file].filter(Boolean).map(k => ({ Key: k as string }))
  const outputKeys = [ticket.output_dzi, ticket.qupath_project, ticket.output_region]
    .filter(Boolean)
    .map(k => ({ Key: (k as string).replace(/^\/+/, '') }))

  try {
    await Promise.all([
      inputKeys.length > 0
        ? r2Client.send(new DeleteObjectsCommand({ Bucket: inputBucket, Delete: { Objects: inputKeys, Quiet: true } }))
        : Promise.resolve(),
      outputKeys.length > 0
        ? r2Client.send(new DeleteObjectsCommand({ Bucket: outputBucket, Delete: { Objects: outputKeys, Quiet: true } }))
        : Promise.resolve(),
    ])
  } catch (err) {
    console.error('deleteTicket R2 cleanup:', err)
  }

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
    .eq('doctor_id', user.id)

  if (error) {
    console.error('deleteTicket DB:', error)
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

  // Verify ownership
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (!patient) return { error: dictionary.validation.unauthorized }

  // Delete all R2 files under {userId}/{patientId}/ in both buckets
  const prefix = `${user.id}/${patientId}/`
  const inputBucket = process.env.R2_INPUT_BUCKET_NAME
  const outputBucket = process.env.R2_OUTPUT_BUCKET_NAME

  try {
    await Promise.all([
      inputBucket  ? deleteR2Prefix(inputBucket,  prefix) : Promise.resolve(),
      outputBucket ? deleteR2Prefix(outputBucket, prefix) : Promise.resolve(),
    ])
  } catch (err) {
    console.error('deletePatient R2 cleanup:', err)
    // Continue with DB deletion even if R2 partial cleanup fails
  }

  // Delete tickets then patient (order matters for FK constraints)
  await supabase.from('tickets').delete().eq('patient_id', patientId).eq('doctor_id', user.id)

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId)
    .eq('doctor_id', user.id)

  if (error) {
    console.error('deletePatient DB:', error)
    return { error: dictionary.validation.genericError }
  }

  revalidatePath('/dashboard/patients')
  redirect('/dashboard/patients')
}