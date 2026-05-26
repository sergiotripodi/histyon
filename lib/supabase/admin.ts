import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Single source of truth for the service-role admin client.
// Used by server actions and API routes that need to bypass RLS.
// Never import this in client components — it contains the service role key.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
