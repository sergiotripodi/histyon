import { createClient } from '@/lib/supabase/server'
import {
  LogIn, LogOut, ShieldCheck, ShieldAlert, User, Mail, Lock,
  UserPlus, UserMinus, FileText, Trash2, UserX, Activity,
} from 'lucide-react'

// ─── Italian labels per action ────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
  login:                  { label: 'Accesso effettuato',             icon: LogIn      },
  logout:                 { label: 'Disconnessione',                 icon: LogOut     },
  mfa_enrolled:           { label: 'Doppio fattore configurato',     icon: ShieldCheck },
  mfa_verified:           { label: 'Verifica 2FA completata',        icon: ShieldCheck },
  profile_updated:        { label: 'Profilo aggiornato',             icon: User       },
  email_change_requested: { label: 'Cambio email richiesto',         icon: Mail       },
  password_changed:       { label: 'Password modificata',            icon: Lock       },
  patient_created:        { label: 'Paziente aggiunto',              icon: UserPlus   },
  patient_deleted:        { label: 'Paziente eliminato',             icon: UserMinus  },
  ticket_created:         { label: 'Analisi avviata',                icon: FileText   },
  ticket_deleted:         { label: 'Analisi eliminata',              icon: Trash2     },
  account_deleted:        { label: 'Account eliminato',              icon: UserX      },
}

// ─── UA parser (minimal — extracts browser/OS from user-agent string) ─────────

function parseUA(ua: string | null): string {
  if (!ua) return 'Dispositivo sconosciuto'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua) ? 'Android (smartphone)' : 'Android (tablet)'
  }
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

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('it-IT', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type LogRow = {
  id: string
  action: string
  success: boolean
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export async function ActivityLogsSection({ doctorId }: { doctorId: string }) {
  const supabase = await createClient()

  const { data: logs, error } = await supabase
    .from('doctor_activity_logs')
    .select('id, action, success, ip_address, user_agent, created_at')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error || !logs) {
    return null
  }

  return (
    <section className="mt-12 pt-8 border-t border-gray-100">

      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900 tracking-wide">Attività recente</h2>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-lg">
        Registro delle ultime {logs.length > 0 ? logs.length : 'N'} azioni sul tuo account. Dati conservati a norma
        GDPR Art.&nbsp;32 e D.Lgs. 196/2003. Se noti accessi non autorizzati, cambia subito la password e contatta{' '}
        <span className="font-medium text-gray-600">info@histyon.com</span>.
      </p>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">Nessuna attività registrata.</p>
      ) : (
        <div className="border border-gray-200 divide-y divide-gray-100">
          {(logs as LogRow[]).map(log => {
            const meta = ACTION_LABELS[log.action] ?? {
              label: log.action,
              icon: Activity,
            }
            const Icon = meta.icon
            const device = parseUA(log.user_agent)

            return (
              <div
                key={log.id}
                className="flex items-start gap-4 px-5 py-4 bg-white hover:bg-gray-50/40 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center border ${
                    log.success
                      ? 'border-gray-200 text-gray-500'
                      : 'border-red-200 text-red-500 bg-red-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${log.success ? 'text-gray-900' : 'text-red-600'}`}>
                      {meta.label}
                      {!log.success && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-red-400">
                          Fallito
                        </span>
                      )}
                    </p>
                    <time
                      dateTime={log.created_at}
                      className="text-[11px] tabular-nums text-gray-400 shrink-0"
                    >
                      {formatDate(log.created_at)}
                    </time>
                  </div>

                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {device}
                    {log.ip_address && (
                      <> · <span className="font-mono">{log.ip_address}</span></>
                    )}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
