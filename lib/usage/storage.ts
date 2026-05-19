import { unstable_cache } from 'next/cache'
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

export function getDoctorStorage(doctorId: string): Promise<StorageStats> {
  return unstable_cache(
    async (): Promise<StorageStats> => {
      const [inputFiles, dziFiles] = await Promise.all([
        listFilesWithSizes(storagePaths.inputDir(doctorId)),
        listFilesWithSizes(storagePaths.dziDir(doctorId)),
      ])
      const inputBytes = sumBytes(inputFiles)
      const dziBytes   = sumBytes(dziFiles)
      return { inputBytes, dziBytes, totalBytes: inputBytes + dziBytes }
    },
    [`storage-doctor-${doctorId}`],
    { revalidate: 3600 }
  )()
}

export function getAllDoctorsStorage(): Promise<DoctorStorageRow[]> {
  return unstable_cache(
    async (): Promise<DoctorStorageRow[]> => {
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
    },
    ['storage-all-doctors'],
    { revalidate: 3600 }
  )()
}

export function getTotalStorage(): Promise<StorageStats> {
  return unstable_cache(
    async (): Promise<StorageStats> => {
      const rows = await getAllDoctorsStorage()
      return rows.reduce(
        (acc, r) => ({
          inputBytes: acc.inputBytes + r.inputBytes,
          dziBytes:   acc.dziBytes   + r.dziBytes,
          totalBytes: acc.totalBytes + r.totalBytes,
        }),
        { inputBytes: 0, dziBytes: 0, totalBytes: 0 }
      )
    },
    ['storage-total'],
    { revalidate: 3600 }
  )()
}
