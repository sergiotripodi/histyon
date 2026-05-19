import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export const TISSUES_BUCKET = 'scottea-tissues'

// ─── Path helpers ─────────────────────────────────────────────────────────────
// Tutte le operazioni storage usano un unico bucket (scottea-tissues).
// input/ → file originali, temporanei (eliminati dall'AI dopo processing)
// dzi/   → DZI + tile, permanenti

export const storagePaths = {
  input:     (d: string, p: string, t: string) => `input/${d}/${p}/${t}`,
  dzi:       (d: string, p: string, t: string) => `dzi/${d}/${p}/${t}.dzi`,
  dziFiles:  (d: string, p: string, t: string) => `dzi/${d}/${p}/${t}_files`,
  inputDir:  (d: string, p?: string) => p ? `input/${d}/${p}` : `input/${d}`,
  dziDir:    (d: string, p?: string) => p ? `dzi/${d}/${p}` : `dzi/${d}`,
}

// ─── Admin client ─────────────────────────────────────────────────────────────

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/** Elimina ricorsivamente tutti i file sotto un prefisso (gestisce cartelle annidate come tile DZI). */
export async function deleteSupabasePrefix(prefix: string): Promise<void> {
  await _deletePrefix(adminClient(), prefix)
}

async function _deletePrefix(
  admin: ReturnType<typeof adminClient>,
  prefix: string
): Promise<void> {
  let offset = 0
  const limit = 100

  while (true) {
    const { data } = await admin.storage
      .from(TISSUES_BUCKET)
      .list(prefix, { limit, offset })

    if (!data || data.length === 0) break

    const files   = data.filter(i => i.id != null  && i.name !== '.emptyFolderPlaceholder')
    const folders = data.filter(i => i.id == null   && i.name !== '.emptyFolderPlaceholder')

    if (files.length > 0) {
      await admin.storage
        .from(TISSUES_BUCKET)
        .remove(files.map(f => `${prefix}/${f.name}`))
    }

    for (const folder of folders) {
      await _deletePrefix(admin, `${prefix}/${folder.name}`)
    }

    if (data.length < limit) break
    offset += limit
  }
}

/** Elimina file specifici dal bucket. */
export async function deleteSupabaseFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  await adminClient().storage.from(TISSUES_BUCKET).remove(paths)
}

// ─── List with sizes (per usage calculation) ──────────────────────────────────

export interface StorageFile {
  path: string
  size: number
}

/** Lista ricorsiva di tutti i file sotto un prefisso con le loro dimensioni. */
export async function listFilesWithSizes(prefix: string): Promise<StorageFile[]> {
  return _listFiles(adminClient(), prefix)
}

async function _listFiles(
  admin: ReturnType<typeof adminClient>,
  prefix: string
): Promise<StorageFile[]> {
  const result: StorageFile[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data } = await admin.storage
      .from(TISSUES_BUCKET)
      .list(prefix, { limit, offset })

    if (!data || data.length === 0) break

    for (const item of data) {
      if (item.name === '.emptyFolderPlaceholder') continue

      if (item.id != null) {
        // File — metadata.size è la dimensione in byte
        result.push({ path: `${prefix}/${item.name}`, size: item.metadata?.size ?? 0 })
      } else {
        // Cartella virtuale — ricorsione
        const nested = await _listFiles(admin, `${prefix}/${item.name}`)
        result.push(...nested)
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return result
}
