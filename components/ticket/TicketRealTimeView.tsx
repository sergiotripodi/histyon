'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  HardDrive, FileText, Maximize2,
  BrainCircuit, Server, Activity, Check,
  UploadCloud, FileCheck, XCircle, X, MapPin
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RealTimeProps { initialTicket: any; dict: any }

// ─── Status theme palette ──────────────────────────────────────────────────
const THEME = {
  UPLOADING: {
    border:    'border-gray-200',
    headerBg:  'bg-gray-50',
    bodyBg:    'bg-white',
    track:     'bg-gray-400',
    dotDone:   'bg-gray-700 border-gray-700',
    dotActive: 'border-gray-500',
    pulse:     'bg-gray-500',
    label:     'text-gray-600',
    title:     'text-gray-700',
  },
  QUEUED: {
    border:    'border-amber-200',
    headerBg:  'bg-amber-50/60',
    bodyBg:    'bg-amber-50/25',
    track:     'bg-amber-400',
    dotDone:   'bg-amber-600 border-amber-600',
    dotActive: 'border-amber-500',
    pulse:     'bg-amber-500',
    label:     'text-amber-700',
    title:     'text-amber-900',
  },
  PROCESSING: {
    border:    'border-blue-200',
    headerBg:  'bg-blue-50/60',
    bodyBg:    'bg-blue-50/25',
    track:     'bg-blue-400',
    dotDone:   'bg-blue-600 border-blue-600',
    dotActive: 'border-blue-500',
    pulse:     'bg-blue-500',
    label:     'text-blue-700',
    title:     'text-blue-900',
  },
  COMPLETED: {
    border:    'border-emerald-200',
    headerBg:  'bg-emerald-50/60',
    bodyBg:    'bg-emerald-50/25',
    track:     'bg-emerald-400',
    dotDone:   'bg-emerald-600 border-emerald-600',
    dotActive: 'border-emerald-500',
    pulse:     'bg-emerald-500',
    label:     'text-emerald-700',
    title:     'text-emerald-900',
  },
  ERROR: {
    border:    'border-red-200',
    headerBg:  'bg-red-100/60',
    bodyBg:    'bg-red-50/60',
    track:     'bg-red-400',
    dotDone:   'bg-red-600 border-red-600',
    dotActive: 'border-red-400',
    pulse:     'bg-red-400',
    label:     'text-red-700',
    title:     'text-red-900',
  },
} as const

// ─── Component ────────────────────────────────────────────────────────────
export function TicketRealtimeView({ initialTicket, dict }: RealTimeProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const supabase = createClient()
  const router   = useRouter()
  const t  = dict.dashboard.realtime
  const tr = dict.dashboard.results

  const status      = (ticket.status || 'UPLOADING').toUpperCase().trim()
  const isError     = ['ERROR', 'FAILED', 'FAIL'].includes(status)
  const isCompleted = status === 'COMPLETED'
  const cfg = THEME[status as keyof typeof THEME] ?? THEME.UPLOADING

  const STEPS = [
    { id: 'UPLOADING',  label: dict.dashboard.tickets.steps.uploading,  icon: UploadCloud },
    { id: 'QUEUED',     label: dict.dashboard.tickets.steps.queued,     icon: Server },
    { id: 'PROCESSING', label: dict.dashboard.tickets.steps.processing, icon: BrainCircuit },
    { id: 'COMPLETED',  label: dict.dashboard.tickets.steps.completed,  icon: FileCheck },
  ]
  const currentIdx = isError ? STEPS.length : STEPS.findIndex(s => s.id === status)

  useEffect(() => {
    const ch = supabase.channel(`ticket-view-${ticket.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tickets',
        filter: `id=eq.${ticket.id}`,
      }, (payload) => {
        setTicket(payload.new)
        if (['COMPLETED', 'ERROR'].includes(payload.new.status)) router.refresh()
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [ticket.id, supabase, router])

  // AI results stats
  const stats       = ticket.results?.summary
  const annotations = ticket.annotations
  const annotCount  = annotations?.features?.length ?? 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Box principale status + risultati ── */}
      <div className={`border ${cfg.border} overflow-hidden`}>

        {/* Header: step indicators */}
        <div className={`${cfg.headerBg} px-8 py-5 border-b ${cfg.border}`}>
          <div className="relative flex items-start justify-between">
            <div className="absolute top-3.5 inset-x-3 h-px bg-gray-200 z-0" />
            <div
              className={`absolute top-3.5 left-3 h-px z-0 transition-all duration-700 ${
                isError ? 'bg-red-200' : cfg.track
              }`}
              style={{
                width: isError
                  ? 'calc(100% - 48px)'
                  : currentIdx > 0
                    ? `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - 24px)`
                    : '0%'
              }}
            />

            {STEPS.map((step, i) => {
              const done   = !isError && i < currentIdx
              const active = !isError && i === currentIdx
              return (
                <div key={step.id} className="relative flex flex-col items-center gap-2.5 flex-1 z-10">
                  <div className={`w-7 h-7 flex items-center justify-center border transition-all duration-500 ${
                    isError  ? 'border-red-200 bg-red-50/80' :
                    done     ? `${cfg.dotDone} text-white` :
                    active   ? `${cfg.dotActive} bg-white` :
                    'border-gray-200 bg-white'
                  }`}>
                    {isError  && <X className="w-3 h-3 text-red-300" />}
                    {!isError && done   && <Check className="w-3.5 h-3.5 text-white" />}
                    {!isError && active && <div className={`w-2.5 h-2.5 ${cfg.pulse} animate-pulse`} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-center transition-colors ${
                    isError  ? 'line-through text-red-200' :
                    active   ? cfg.label :
                    done     ? 'text-gray-400' :
                    'text-gray-200'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className={`${cfg.bodyBg} p-8`}>

          {isCompleted && (
            <div className="space-y-7">
              <div>
                <p className={`text-sm font-bold mb-5 ${cfg.title}`}>{t.reportReady}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/viewer/${ticket.id}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-elegant-soft flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> {t.openViewer}
                  </Link>
                  {annotCount > 0 && (
                    <div className="btn-elegant-soft flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium opacity-70 cursor-default">
                      <MapPin className="w-3.5 h-3.5" />
                      {annotCount} {annotCount === 1 ? 'annotazione' : 'annotazioni'}
                    </div>
                  )}
                </div>
              </div>

              {stats && (
                <div className="border-t border-current/10 pt-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-4 opacity-60">
                    <Activity className="w-3.5 h-3.5" /> {t.tissueStats}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: tr.sickTissue,  value: `${stats.percentuale_tessuto_malato?.toFixed(1)}%` },
                      { label: tr.totalGlom,   value: stats.counts?.glomeruli || 0 },
                      { label: tr.scleroGlom,  value: stats.counts?.glomeruli_sclerotici || 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/60 border border-current/10 p-4">
                        <p className="text-[10px] uppercase font-bold opacity-50 mb-1">{label}</p>
                        <p className="text-2xl font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isCompleted && !isError && (
            <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
              <div className="w-14 h-14 bg-white/60 border border-current/10 flex items-center justify-center">
                {status === 'PROCESSING'
                  ? <BrainCircuit className={`w-6 h-6 ${cfg.label} animate-pulse`} />
                  : <Server className={`w-6 h-6 ${cfg.label}`} />
                }
              </div>
              <p className={`text-sm font-medium ${cfg.title}`}>{t.analyzing}</p>
            </div>
          )}

          {isError && (
            <div className="space-y-5">
              <p className={`text-sm font-bold ${cfg.title}`}>{t.reportUnavailable}</p>
              <div className="border-l-2 border-red-400 bg-red-50/60 px-5 py-4 flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800 tracking-tight">
                    {dict.dashboard.tickets.status.failedAnalysis}
                  </p>
                  <p className="text-xs text-red-500 mt-0.5 leading-relaxed">{t.genericError}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Box inferiori: info analisi + note ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5" /> {t.sourceData}
          </h3>
          <div className="bg-gray-50 p-3 border border-gray-200 mb-3">
            <p className="font-mono text-xs text-gray-500">
              #{ticket.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex justify-end text-xs text-gray-500 font-medium">
            <span suppressHydrationWarning>{new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> {t.clinicalNotes}
          </h3>
          <p className="text-sm text-gray-600 italic leading-relaxed">{ticket.notes || t.noNotes}</p>
        </div>

      </div>
    </div>
  )
}
