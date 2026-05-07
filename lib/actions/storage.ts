'use server'

import { createClient } from '@/lib/supabase/server'
import { r2Client } from '@/lib/storage/r2'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'
import { dictionary } from '@/lib/dictionary'
import { isAllowedAssetUrl } from '@/lib/url-security'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024

const ALLOWED_UPLOAD_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
  'application/octet-stream',
])
const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'tif',
  'tiff',
  'webp',
  'svs',
  'ndpi',
  'mrxs',
  'vms',
  'vmu',
  'scn',
  'btf',
  'dcm',
  'czi',
  'bif'
])

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

  const ext = sanitizeExtension(originalName)
  const normalizedType = (fileType || '').toLowerCase().split(';')[0].trim()
  const hasAllowedMime = normalizedType.length > 0 && ALLOWED_UPLOAD_TYPES.has(normalizedType)
  const hasKnownExtension = ALLOWED_UPLOAD_EXTENSIONS.has(ext)
  if (!hasAllowedMime && !hasKnownExtension) {
    return { error: dictionary.validation.uploadError }
  }
  const contentTypeForUpload = hasAllowedMime ? normalizedType : 'application/octet-stream'

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

  try {
    const customFileName = `scaninput-${ticketId}.${ext}`
    const filePath = `${user.id}/${patientId}/${customFileName}`

    const { error: dbError } = await supabase.from('tickets').insert({
      id: ticketId,
      doctor_id: user.id,
      patient_id: patientId,
      input_file: filePath,
      file_name: customFileName,
      file_size: fileSize,
      status: 'UPLOADING',
      notes: normalizeNotes(notes),
    })

    if (dbError) {
      console.error('Upload DB insert:', dbError)
      return { error: dictionary.validation.genericError }
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_INPUT_BUCKET_NAME,
      Key: filePath,
      ContentType: contentTypeForUpload,
      Metadata: { originalName: originalName.slice(0, 512) },
    })

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })

    return { success: true, url: signedUrl, ticketId }
  } catch (error: unknown) {
    console.error('Upload Error:', error)
    await supabase
      .from('tickets')
      .update({ status: 'ERROR', ai_metadata: { error: 'upload_presign_failed' } })
      .eq('id', ticketId)
    return { error: dictionary.validation.genericError }
  }
}

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

/** Download project zip for a ticket owned by the current user (no arbitrary paths). */
export async function getTicketProjectDownloadUrl(ticketId: string) {
  if (!UUID_RE.test(ticketId)) {
    return { error: dictionary.validation.fileRetrievalError }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('qupath_project')
    .eq('id', ticketId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (error || !ticket?.qupath_project) {
    return { error: dictionary.validation.fileRetrievalError }
  }

  const projectUrl = ticket.qupath_project as string

  if (/^https?:\/\//i.test(projectUrl.trim())) {
    if (!isAllowedAssetUrl(projectUrl.trim())) {
      return { error: dictionary.validation.fileRetrievalError }
    }
    return { success: true, url: projectUrl.trim() }
  }

  const key = projectUrl.replace(/^\/+/, '')
  if (!key.startsWith(`${user.id}/`)) {
    return { error: dictionary.validation.unauthorized }
  }

  const bucket = process.env.R2_OUTPUT_BUCKET_NAME
  if (!bucket) {
    return { error: dictionary.validation.fileRetrievalError }
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: 'attachment',
    })
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 })
    return { success: true, url: signedUrl }
  } catch (e) {
    console.error('getTicketProjectDownloadUrl:', e)
    return { error: dictionary.validation.fileRetrievalError }
  }
}

export async function getRegionDownloadUrl(ticketId: string) {
  if (!UUID_RE.test(ticketId)) {
    return { error: dictionary.validation.fileRetrievalError }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: dictionary.validation.unauthorized }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('output_region')
    .eq('id', ticketId)
    .eq('doctor_id', user.id)
    .maybeSingle()

  if (error || !ticket?.output_region) {
    return { error: dictionary.validation.fileRetrievalError }
  }

  const regionUrl = ticket.output_region as string

  if (/^https?:\/\//i.test(regionUrl.trim())) {
    if (!isAllowedAssetUrl(regionUrl.trim())) {
      return { error: dictionary.validation.fileRetrievalError }
    }
    return { success: true, url: regionUrl.trim() }
  }

  const key = regionUrl.replace(/^\/+/, '')
  if (!key.startsWith(`${user.id}/`)) {
    return { error: dictionary.validation.unauthorized }
  }

  const bucket = process.env.R2_OUTPUT_BUCKET_NAME
  if (!bucket) return { error: dictionary.validation.fileRetrievalError }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: 'attachment',
    })
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 })
    return { success: true, url: signedUrl }
  } catch (e) {
    console.error('getRegionDownloadUrl:', e)
    return { error: dictionary.validation.fileRetrievalError }
  }
}
