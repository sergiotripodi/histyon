import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { logger } from '@/lib/logger'
import type { Json } from '@/types/database'

// ─── Action types ────────────────────────────────────────────────────────────

export type DoctorAction =
  | 'login'
  | 'logout'
  | 'mfa_enrolled'
  | 'mfa_verified'
  | 'profile_updated'
  | 'email_change_requested'
  | 'password_changed'
  | 'patient_created'
  | 'patient_deleted'
  | 'ticket_created'
  | 'ticket_deleted'
  | 'account_deleted'

export type AdminAction =
  | 'admin_login'
  | 'admin_logout'
  | 'admin_mfa_enrolled'
  | 'admin_mfa_verified'
  | 'user_approved'
  | 'user_rejected'
  | 'user_suspended'
  | 'user_reactivated'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getRequestContext(): Promise<{ ip: string | null; ua: string | null }> {
  try {
    const h = await headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      h.get('x-real-ip') ??
      null
    const ua = h.get('user-agent') ?? null
    return { ip, ua }
  } catch {
    return { ip: null, ua: null }
  }
}

// ─── Doctor activity log ─────────────────────────────────────────────────────

export interface DoctorLogOpts {
  success?: boolean
  entityType?: 'patient' | 'ticket' | 'account' | 'session'
  entityId?: string
  metadata?: Record<string, unknown>
}

/**
 * Fire-and-forget: logs a doctor's action via service-role client.
 * Never throws — failures are logged to the server logger only.
 */
export async function logDoctorActivity(
  doctorId: string,
  action: DoctorAction,
  opts: DoctorLogOpts = {},
): Promise<void> {
  const { success = true, entityType, entityId, metadata } = opts
  const { ip, ua } = await getRequestContext()

  const admin = createAdminClient()
  const { error } = await admin.from('doctor_activity_logs').insert({
    doctor_id:   doctorId,
    action,
    entity_type: entityType ?? null,
    entity_id:   entityId   ?? null,
    success,
    ip_address:  ip,
    user_agent:  ua,
    metadata:    (metadata ?? null) as Json | null,
  })

  if (error) {
    logger.warn('logDoctorActivity: insert failed', { doctorId, action, code: error.code })
  }
}

// ─── Admin activity log ──────────────────────────────────────────────────────

export interface AdminLogOpts {
  success?: boolean
  targetUserId?: string
  metadata?: Record<string, unknown>
}

/**
 * Fire-and-forget: logs an admin action via service-role client.
 * Never throws — failures are logged to the server logger only.
 */
export async function logAdminActivity(
  adminId: string,
  action: AdminAction,
  opts: AdminLogOpts = {},
): Promise<void> {
  const { success = true, targetUserId, metadata } = opts
  const { ip, ua } = await getRequestContext()

  const admin = createAdminClient()
  const { error } = await admin.from('admin_activity_logs').insert({
    admin_id:       adminId,
    action,
    target_user_id: targetUserId ?? null,
    success,
    ip_address:     ip,
    user_agent:     ua,
    metadata:       (metadata ?? null) as Json | null,
  })

  if (error) {
    logger.warn('logAdminActivity: insert failed', { adminId, action, code: error.code })
  }
}
