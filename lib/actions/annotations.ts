'use server'

import { createClient } from '@/lib/supabase/server'
import type { Annotations } from '@/types'
import type { Json } from '@/types/database'

export async function saveAnnotations(
  ticketId: string,
  annotations: Annotations
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tickets')
    .update({ annotations: annotations as unknown as Json })
    .eq('id', ticketId)
    .eq('doctor_id', user.id)

  if (error) return { error: error.message }
  return {}
}
