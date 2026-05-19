import { cacheTag, cacheLife } from 'next/cache'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { listFilesWithSizes, storagePaths } from '@/lib/storage/supabase'

export interface StorageStats {
  inputBytes: number
  dziBytes:   number
  totalBytes: number
}

export interface DoctorStorageRow extends StorageStats {
  doctorId: string
}

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function sumBytes(files: { size: number }[]): number {
  return files.reduce((s, f) => s + f.size, 0)
}

export function doctorStorageTag(doctorId: string) {
  return `storage-doctor-${doctorId}`
}

export async function getDoctorStorage(doctorId: string): Promise<StorageStats> {
  'use cache'
  cacheTag(doctorStorageTag(doctorId), 'storage-all')
  cacheLife('hours')

  const [inputFiles, dziFiles] = await Promise.all([
    listFilesWithSizes(storagePaths.inputDir(doctorId)),
    listFilesWithSizes(storagePaths.dziDir(doctorId)),
  ])
  const inputBytes = sumBytes(inputFiles)
  const dziBytes   = sumBytes(dziFiles)
  return { inputBytes, dziBytes, totalBytes: inputBytes + dziBytes }
}

export async function getAllDoctorsStorage(): Promise<DoctorStorageRow[]> {
  'use cache'
  cacheTag('storage-all')
  cacheLife('hours')

  const admin = adminClient()
  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .neq('role', 'admin')

  if (!profiles || profiles.length === 0) return []

  return Promise.all(
    profiles.map(async ({ id }) => {
      const stats = await getDoctorStorage(id)
      return { doctorId: id, ...stats }
    })
  )
}

export async function getTotalStorage(): Promise<StorageStats> {
  'use cache'
  cacheTag('storage-all')
  cacheLife('hours')

  const rows = await getAllDoctorsStorage()
  return rows.reduce(
    (acc, r) => ({
      inputBytes: acc.inputBytes + r.inputBytes,
      dziBytes:   acc.dziBytes   + r.dziBytes,
      totalBytes: acc.totalBytes + r.totalBytes,
    }),
    { inputBytes: 0, dziBytes: 0, totalBytes: 0 }
  )
}
