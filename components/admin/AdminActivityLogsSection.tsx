import { createAdminClient } from '@/lib/supabase/admin'
import {
  LogIn, LogOut, ShieldCheck, ShieldAlert,
  UserCheck, UserX, UserMinus, UserCog, Trash2, Activity,
} from 'lucide-react'

// ─── Italian labels per action ────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
  admin_login:          { label: 'Accesso effettuato',          icon: LogIn       },
  admin_logout:         { label: 'Disconnessione',              icon: LogOut      },
  admin_mfa_enrolled:   { label: '2FA configurato',             icon: ShieldCheck },
  admin_mfa_verified:   { label: 'Verifica 2FA',                icon: ShieldCheck },
  user_approved:        { label: 'Account dottore approvato',   icon: UserCheck   },
  user_rejected:        { label: 'Account dottore rifiutato',   icon: UserX       },
  user_suspended:       { label: 'Account dottore disattivato', icon: UserMinus   },
  user_reactivated:     { label: 'Account dottore riattivato',  icon: UserCog     },
  account_auto_deleted: { label: 'Account eliminato (sistema)', icon: Trash2      },
}

// ─── UA parser ────────────────────────────────────────────────────────────────

function parseUA(ua: string | null): string {
  if (!ua) return 'Dispositivo sconosciuto'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'Android (smartphone)' : 'Android (tablet)'
  if (/Macintosh|Mac OS X/i.test(ua)) {
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Mac · Chrome'
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Mac · Safari'
    if (/Firefox/i.test(ua)) return 'Mac · Firefox'
    if (/Edg/i.test(ua)) return 'Mac · Edge'
    return 'Mac'
  }
  if (/Windows/i.test(ua)) {
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Windows · Chrome'
    if (/Firefox/i.test(ua)) return 'Windows · Firefox'
    if (/Edg/i.test(ua)) return 'Windows · Edge'
    return 'Windows'
  }
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Dispositivo sconosciuto'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type LogRow = {
  id: string
  action: string
  success: boolean
  ip_address: string | null
  user_agent: string | null
  target_user_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export async function AdminActivityLogsSection({ adminId }: { adminId: string }) {
  const admin = createAdminClient()

  const { data: logs, error } = await admin
    .from('admin_activity_logs')
    .select('id, action, success, ip_address, user_agent, target_user_id, metadata, created_at')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !logs || logs.length === 0) return null

  return (
    <div className="border-t border-gray-100 pt-10 mt-2">

      <div className="flex items-center gap-3 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Attività account admin</p>
      </div>
      <p className="text-xs text-gray-400 mb-6 max-w-xl leading-relaxed">
        Ultime {logs.length} azioni registrate su questo account admin. Log conservati 2 anni (GDPR Art.&nbsp;5).
      </p>

      <div className="border border-gray-200 divide-y divide-gray-100">
        {(logs as LogRow[]).map(log => {
          const meta  = ACTION_LABELS[log.action] ?? { label: log.action, icon: Activity }
          const Icon  = meta.icon
          const device = parseUA(log.user_agent)

          // Show target user info for user-management actions
          const hasTarget = !!log.target_user_id
          const targetNote = hasTarget
            ? `ID: ${log.target_user_id!.slice(0, 8)}…`
            : null

          return (
            <div
              key={log.id}
              className="flex items-start gap-4 px-5 py-3.5 bg-white hover:bg-gray-50/40 transition-colors"
            >
              {/* Icon */}
              <div
                className={`mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center border ${
                  !log.success
                    ? 'border-red-200 text-red-500 bg-red-50'
                    : log.action.startsWith('user_')
                      ? 'border-gray-300 text-gray-600'
                      : 'border-gray-200 text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${!log.success ? 'text-red-600' : 'text-gray-900'}`}>
                    {meta.label}
                    {!log.success && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-red-400">Fallito</span>
                    )}
                  </p>
                  <time dateTime={log.created_at} className="text-[11px] tabular-nums text-gray-400 shrink-0">
                    {formatDate(log.created_at)}
                  </time>
                </div>

                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {device}
                  {log.ip_address && <> · <span className="font-mono">{log.ip_address}</span></>}
                  {targetNote && <> · <span className="text-gray-500">{targetNote}</span></>}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
