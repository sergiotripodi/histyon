'use server'

import { createClient } from '@/lib/supabase/server'
import type { Annotations } from '@/types'

export async function saveAnnotations(
  ticketId: string,
  annotations: Annotations
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tickets')
    .update({ annotations })
    .eq('id', ticketId)
    .eq('doctor_id', user.id)

  if (error) return { error: error.message }
  return {}
}
