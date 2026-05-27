'use client'

import { useState, useCallback } from 'react'
import {
  LogIn, LogOut, ShieldCheck, User, Mail, Lock,
  UserPlus, UserMinus, FileText, Trash2, UserX,
  Activity, Monitor, Smartphone, MapPin,
} from 'lucide-react'
import { parseUA, isMobile, formatDateTime, timeAgo } from '@/lib/logs/format'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionRow = {
  id:           string
  created_at:   string
  updated_at:   string
  refreshed_at: string | null
  user_agent:   string | null
  ip:           string | null
}

export type LogRow = {
  id:           string
  action:       string
  success:      boolean
  ip_address:   string | null
  user_agent:   string | null
  created_at:   string
}

export interface ActivityLogsTabsProps {
  sessions:             SessionRow[]
  initialAccessLogs:    LogRow[]
  initialActivityLogs:  LogRow[]
  accessHasMore:        boolean
  activityHasMore:      boolean
}

// ─── Action labels & icons ────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
  login:                  { label: 'Accesso effettuato',         icon: LogIn       },
  logout:                 { label: 'Disconnessione',             icon: LogOut      },
  mfa_enrolled:           { label: 'Doppio fattore configurato', icon: ShieldCheck },
  mfa_verified:           { label: 'Verifica 2FA',               icon: ShieldCheck },
  profile_updated:        { label: 'Profilo aggiornato',         icon: User        },
  email_change_requested: { label: 'Cambio email richiesto',     icon: Mail        },
  password_changed:       { label: 'Password modificata',        icon: Lock        },
  patient_created:        { label: 'Paziente aggiunto',          icon: UserPlus    },
  patient_deleted:        { label: 'Paziente eliminato',         icon: UserMinus   },
  ticket_created:         { label: 'Analisi avviata',            icon: FileText    },
  ticket_deleted:         { label: 'Analisi eliminata',          icon: Trash2      },
  account_deleted:        { label: 'Account eliminato',          icon: UserX       },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SessionCard({ s }: { s: SessionRow }) {
  const device = parseUA(s.user_agent)
  const mobile = isMobile(s.user_agent)
  const lastActive = s.refreshed_at ?? s.updated_at
  const DeviceIcon = mobile ? Smartphone : Monitor

  return (
    <div className="flex items-start gap-4 px-5 py-4 bg-white hover:bg-gray-50/40 transition-colors">
      <div className="mt-0.5 shrink-0 w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400">
        <DeviceIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{device}</p>
          <span className="text-[11px] tabular-nums text-gray-400 shrink-0">
            Ultimo accesso: {timeAgo(lastActive)}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
          {s.ip && (
            <>
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="font-mono">{s.ip}</span>
              <span className="mx-1">·</span>
            </>
          )}
          <span>Sessione aperta il {formatDateTime(s.created_at)}</span>
        </p>
      </div>
    </div>
  )
}

function LogItem({ log }: { log: LogRow }) {
  const meta = ACTION_META[log.action] ?? { label: log.action, icon: Activity }
  const Icon = meta.icon
  const device = parseUA(log.user_agent)

  return (
    <div className="flex items-start gap-4 px-5 py-3.5 bg-white hover:bg-gray-50/40 transition-colors">
      <div className={`mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center border ${
        !log.success ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400'
      }`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className={`text-sm font-medium ${!log.success ? 'text-red-600' : 'text-gray-900'}`}>
            {meta.label}
            {!log.success && (
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-red-400">Fallito</span>
            )}
          </p>
          <time dateTime={log.created_at} className="text-[11px] tabular-nums text-gray-400 shrink-0">
            {formatDateTime(log.created_at)}
          </time>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          {device}
          {log.ip_address && <> · <span className="font-mono">{log.ip_address}</span></>}
        </p>
      </div>
    </div>
  )
}

// ─── Load-more hook ───────────────────────────────────────────────────────────

function useLogPagination(initial: LogRow[], initialHasMore: boolean, type: 'access' | 'activity') {
  const [logs,    setLogs]    = useState<LogRow[]>(initial)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || logs.length === 0) return
    setLoading(true)
    const cursor = logs[logs.length - 1].created_at
    try {
      const res  = await fetch(`/api/logs/doctor?type=${type}&cursor=${encodeURIComponent(cursor)}`)
      const json = await res.json() as { logs: LogRow[]; hasMore: boolean }
      setLogs(prev => [...prev, ...json.logs])
      setHasMore(json.hasMore)
    } finally {
      setLoading(false)
    }
  }, [logs, hasMore, loading, type])

  return { logs, hasMore, loading, loadMore }
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'sessions' | 'access' | 'activity'

export function ActivityLogsTabs({
  sessions,
  initialAccessLogs,
  initialActivityLogs,
  accessHasMore,
  activityHasMore,
}: ActivityLogsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('sessions')

  const access   = useLogPagination(initialAccessLogs,   accessHasMore,   'access')
  const activity = useLogPagination(initialActivityLogs, activityHasMore, 'activity')

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'sessions', label: 'Sessioni',  count: sessions.length   },
    { id: 'access',   label: 'Accessi',   count: access.logs.length   },
    { id: 'activity', label: 'Attività',  count: activity.logs.length },
  ]

  return (
    <section className="mt-12 pt-8 border-t border-gray-100">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900 tracking-wide">Log e sessioni</h2>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-lg">
        Sessioni registrate e attività recente sul tuo account.
        Dati conservati 2 anni (GDPR Art.&nbsp;5 · D.Lgs.&nbsp;196/2003).
        Se noti accessi non autorizzati cambia subito la password e contatta{' '}
        <span className="font-medium text-gray-600">info@histyon.com</span>.
      </p>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium tracking-wide border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-2 text-[10px] tabular-nums ${
                activeTab === tab.id ? 'text-gray-500' : 'text-gray-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="border border-t-0 border-gray-200">

        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-6">Nessuna sessione trovata.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {sessions.map(s => <SessionCard key={s.id} s={s} />)}
              </div>
            )}
          </>
        )}

        {/* Access logs tab */}
        {activeTab === 'access' && (
          <>
            {access.logs.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-6">Nessun log di accesso.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {access.logs.map(log => <LogItem key={log.id} log={log} />)}
              </div>
            )}
            {access.hasMore && (
              <div className="border-t border-gray-100 px-5 py-3">
                <button
                  onClick={access.loadMore}
                  disabled={access.loading}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
                >
                  {access.loading ? 'Caricamento…' : 'Carica altri →'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Activity logs tab */}
        {activeTab === 'activity' && (
          <>
            {activity.logs.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-6">Nessuna attività registrata.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {activity.logs.map(log => <LogItem key={log.id} log={log} />)}
              </div>
            )}
            {activity.hasMore && (
              <div className="border-t border-gray-100 px-5 py-3">
                <button
                  onClick={activity.loadMore}
                  disabled={activity.loading}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors disabled:opacity-50"
                >
                  {activity.loading ? 'Caricamento…' : 'Carica altri →'}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  )
}
