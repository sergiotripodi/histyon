import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export const INPUT_BUCKET = 'scottea-input'
export const DZI_BUCKET   = 'scottea-dzi'

/** Admin client con service role — usato solo server-side per operazioni storage privilegiate. */
function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Elimina tutti i file sotto un prefisso nel bucket specificato. */
export async function deleteSupabasePrefix(bucket: string, prefix: string): Promise<void> {
  const admin = adminClient()
  let offset  = 0
  const limit = 100

  while (true) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit, offset, search: '' })

    if (error || !data || data.length === 0) break

    const paths = data
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => `${prefix}/${f.name}`)

    if (paths.length > 0) {
      await admin.storage.from(bucket).remove(paths)
    }

    if (data.length < limit) break
    offset += limit
  }
}

/** Elimina uno o più file specifici dal bucket. */
export async function deleteSupabaseFiles(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const admin = adminClient()
  await admin.storage.from(bucket).remove(paths)
}
