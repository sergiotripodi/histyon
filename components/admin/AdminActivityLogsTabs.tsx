'use client'

import { useState, useCallback } from 'react'
import {
  LogIn, LogOut, ShieldCheck,
  UserCheck, UserX, UserMinus, UserCog, Trash2,
  Activity, Monitor, Smartphone, MapPin, X, Loader2,
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

export type AdminLogRow = {
  id:             string
  action:         string
  success:        boolean
  ip_address:     string | null
  user_agent:     string | null
  target_user_id: string | null
  created_at:     string
}

export interface AdminActivityLogsTabsProps {
  sessions:             SessionRow[]
  currentSessionId:     string | null
  initialAccessLogs:    AdminLogRow[]
  initialActivityLogs:  AdminLogRow[]
  accessHasMore:        boolean
  activityHasMore:      boolean
}

// ─── Action labels & icons ────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
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

// ─── Session card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  s:         SessionRow
  isCurrent: boolean
  loadingId: string | null
  onRevoke:  (id: string) => void
}

function SessionCard({ s, isCurrent, loadingId, onRevoke }: SessionCardProps) {
  const device     = parseUA(s.user_agent)
  const mobile     = isMobile(s.user_agent)
  const lastActive = s.refreshed_at ?? s.updated_at
  const DeviceIcon = mobile ? Smartphone : Monitor
  const isLoading  = loadingId === s.id

  return (
    <div className={`flex items-start gap-4 px-5 py-4 transition-colors ${
      isCurrent ? 'bg-gray-50' : 'bg-white hover:bg-gray-50/40'
    }`}>
      <div className={`mt-0.5 shrink-0 w-8 h-8 flex items-center justify-center border ${
        isCurrent ? 'border-gray-400 text-gray-600' : 'border-gray-200 text-gray-400'
      }`}>
        <DeviceIcon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
            {device}
            {isCurrent && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 border border-gray-300 px-1.5 py-0.5">
                Questa sessione
              </span>
            )}
          </p>
          <span className="text-[11px] tabular-nums text-gray-400 shrink-0">
            Ultimo accesso: {timeAgo(lastActive)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5 flex-wrap">
          <p className="text-[11px] text-gray-400 flex items-center gap-1 flex-wrap">
            {s.ip && (
              <>
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                <span className="font-mono">{s.ip}</span>
                <span className="mx-1">·</span>
              </>
            )}
            <span>Sessione aperta il {formatDateTime(s.created_at)}</span>
          </p>
          {!isCurrent && (
            <button
              onClick={() => onRevoke(s.id)}
              disabled={isLoading || loadingId !== null}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40 shrink-0"
            >
              {isLoading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Disconnessione…</>
                : <><X className="w-3 h-3" /> Disconnetti</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Log item ─────────────────────────────────────────────────────────────────

function AdminLogItem({ log }: { log: AdminLogRow }) {
  const meta = ACTION_META[log.action] ?? { label: log.action, icon: Activity }
  const Icon = meta.icon
  const targetNote = log.target_user_id ? `ID: ${log.target_user_id.slice(0, 8)}…` : null

  return (
    <div className="flex items-start gap-4 px-5 py-3.5 bg-white hover:bg-gray-50/40 transition-colors">
      <div className={`mt-0.5 shrink-0 w-7 h-7 flex items-center justify-center border ${
        !log.success
          ? 'border-red-200 text-red-500 bg-red-50'
          : log.action.startsWith('user_')
            ? 'border-gray-300 text-gray-600'
            : 'border-gray-200 text-gray-400'
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
          {parseUA(log.user_agent)}
          {log.ip_address && <> · <span className="font-mono">{log.ip_address}</span></>}
          {targetNote && <> · <span className="text-gray-500">{targetNote}</span></>}
        </p>
      </div>
    </div>
  )
}

// ─── Load-more hook ───────────────────────────────────────────────────────────

function useLogPagination(initial: AdminLogRow[], initialHasMore: boolean, type: 'access' | 'activity') {
  const [logs,    setLogs]    = useState<AdminLogRow[]>(initial)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || logs.length === 0) return
    setLoading(true)
    const cursor = logs[logs.length - 1].created_at
    try {
      const res  = await fetch(`/api/logs/admin?type=${type}&cursor=${encodeURIComponent(cursor)}`)
      const json = await res.json() as { logs: AdminLogRow[]; hasMore: boolean }
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

export function AdminActivityLogsTabs({
  sessions: initialSessions,
  currentSessionId,
  initialAccessLogs,
  initialActivityLogs,
  accessHasMore,
  activityHasMore,
}: AdminActivityLogsTabsProps) {
  const [activeTab,  setActiveTab]  = useState<Tab>('sessions')
  const [sessions,   setSessions]   = useState<SessionRow[]>(initialSessions)
  const [loadingId,  setLoadingId]  = useState<string | null>(null)

  const access   = useLogPagination(initialAccessLogs,   accessHasMore,   'access')
  const activity = useLogPagination(initialActivityLogs, activityHasMore, 'activity')

  const revokeSession = useCallback(async (sessionId: string) => {
    setLoadingId(sessionId)
    try {
      const res = await fetch('/api/sessions/revoke', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId }),
      })
      if (res.ok) setSessions(prev => prev.filter(s => s.id !== sessionId))
    } finally {
      setLoadingId(null)
    }
  }, [])

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'sessions', label: 'Sessioni',  count: sessions.length      },
    { id: 'access',   label: 'Accessi',   count: access.logs.length   },
    { id: 'activity', label: 'Attività',  count: activity.logs.length },
  ]

  return (
    <div className="border-t border-gray-100 pt-10 mt-2">

      <div className="flex items-center gap-3 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Attività account admin</p>
      </div>
      <p className="text-xs text-gray-400 mb-6 max-w-xl leading-relaxed">
        Sessioni attive e log di questo account admin. Dati conservati 2 anni (GDPR Art.&nbsp;5).
      </p>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
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

        {activeTab === 'sessions' && (
          <>
            {sessions.length === 0
              ? <p className="text-sm text-gray-400 px-5 py-6">Nessuna sessione trovata.</p>
              : <div className="divide-y divide-gray-100">
                  {sessions.map(s => (
                    <SessionCard key={s.id} s={s}
                      isCurrent={s.id === currentSessionId}
                      loadingId={loadingId}
                      onRevoke={revokeSession}
                    />
                  ))}
                </div>
            }
          </>
        )}

        {activeTab === 'access' && (
          <>
            {access.logs.length === 0
              ? <p className="text-sm text-gray-400 px-5 py-6">Nessun log di accesso.</p>
              : <div className="divide-y divide-gray-100">{access.logs.map(log => <AdminLogItem key={log.id} log={log} />)}</div>
            }
            {access.hasMore && (
              <div className="border-t border-gray-100 px-5 py-3">
                <button onClick={access.loadMore} disabled={access.loading}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors disabled:opacity-50">
                  {access.loading ? 'Caricamento…' : 'Carica altri →'}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'activity' && (
          <>
            {activity.logs.length === 0
              ? <p className="text-sm text-gray-400 px-5 py-6">Nessuna attività registrata.</p>
              : <div className="divide-y divide-gray-100">{activity.logs.map(log => <AdminLogItem key={log.id} log={log} />)}</div>
            }
            {activity.hasMore && (
              <div className="border-t border-gray-100 px-5 py-3">
                <button onClick={activity.loadMore} disabled={activity.loading}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors disabled:opacity-50">
                  {activity.loading ? 'Caricamento…' : 'Carica altri →'}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
