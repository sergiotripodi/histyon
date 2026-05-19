'use server'

import { createClient } from '@/lib/supabase/server'
import { INPUT_BUCKET } from '@/lib/storage/supabase'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'
import { dictionary } from '@/lib/dictionary'
import { ALLOWED_SLIDE_EXTENSIONS, MAX_UPLOAD_BYTES } from '@/lib/constants'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
  'application/octet-stream',
])
const ALLOWED_UPLOAD_EXTENSIONS = new Set<string>([...ALLOWED_SLIDE_EXTENSIONS])

function sanitizeExtension(originalName: string): string {
  const raw = (originalName.split('.').pop() || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (!raw || raw.length > 8) return 'bin'
  return raw
}

function normalizeNotes(notes: string): string {
  return notes.trim().slice(0, 8000)
}

/**
 * Crea un ticket nel DB e restituisce una Signed Upload URL di Supabase Storage.
 * Il file sarà salvato come {userId}/{patientId}/{ticketId} (path UUID-based, nessun filename originale).
 */
export async function getPresignedUploadUrl(
  originalName: string,
  fileType: string,
  fileSize: number,
  patientId: string,
  notes: string = ''
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  if (!UUID_RE.test(patientId)) {
    return { error: dictionary.validation.genericError }
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_UPLOAD_BYTES) {
    return { error: dictionary.validation.genericError }
  }

  const ext            = sanitizeExtension(originalName)
  const normalizedType = (fileType || '').toLowerCase().split(';')[0].trim()
  const hasAllowedMime = normalizedType.length > 0 && ALLOWED_UPLOAD_TYPES.has(normalizedType)
  const hasKnownExt    = ALLOWED_UPLOAD_EXTENSIONS.has(ext)
  if (!hasAllowedMime && !hasKnownExt) {
    return { error: dictionary.validation.uploadError }
  }
  const contentType = hasAllowedMime ? normalizedType : 'application/octet-stream'

  // Verifica proprietà paziente
  const { data: patientRow, error: patientErr } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (patientErr || !patientRow) {
    return { error: dictionary.validation.unauthorized }
  }

  const ticketId = uuidv4()
  // Path UUID-based: nessun filename originale salvato
  const storagePath = `${user.id}/${patientId}/${ticketId}`

  try {
    // Inserisci il ticket nel DB prima di creare la signed URL
    const { error: dbError } = await supabase.from('tickets').insert({
      id:         ticketId,
      doctor_id:  user.id,
      patient_id: patientId,
      input_file: storagePath,
      file_size:  fileSize,
      status:     'UPLOADING',
      notes:      normalizeNotes(notes),
    })

    if (dbError) {
      console.error('Upload DB insert:', dbError)
      return { error: dictionary.validation.genericError }
    }

    // Crea la signed upload URL tramite Supabase Storage
    const { data: signedData, error: signedErr } = await supabase.storage
      .from(INPUT_BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: false })

    if (signedErr || !signedData) {
      console.error('Supabase signed upload URL:', signedErr)
      await supabase
        .from('tickets')
        .update({ status: 'ERROR', ai_metadata: { error: 'upload_presign_failed' } })
        .eq('id', ticketId)
      return { error: dictionary.validation.genericError }
    }

    return {
      success:   true,
      url:       signedData.signedUrl,
      token:     signedData.token,
      path:      signedData.path,
      ticketId,
      contentType,
    }
  } catch (error: unknown) {
    console.error('Upload Error:', error)
    await supabase
      .from('tickets')
      .update({ status: 'ERROR', ai_metadata: { error: 'upload_presign_failed' } })
      .eq('id', ticketId)
    return { error: dictionary.validation.genericError }
  }
}

/** Segna il ticket come QUEUED dopo che il frontend ha completato l'upload. */
export async function confirmUpload(ticketId: string) {
  if (!UUID_RE.test(ticketId)) {
    return { error: dictionary.validation.genericError }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  const { data: ticket, error: fetchErr } = await supabase
    .from('tickets')
    .select('id, status')
    .eq('id', ticketId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (fetchErr || !ticket) {
    return { error: dictionary.validation.unauthorized }
  }

  if (ticket.status !== 'UPLOADING') {
    return { success: true }
  }

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'QUEUED' })
    .eq('id', ticketId)
    .eq('doctor_id', user.id)

  if (error) {
    console.error('confirmUpload:', error)
    return { error: dictionary.validation.genericError }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
