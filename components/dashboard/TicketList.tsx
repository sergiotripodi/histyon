'use client'

import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TicketListProps {
  tickets:          any[]
  showPatientName?: boolean
  doctorId?:        string
  patientId?:       string
  dict:             any
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function getDisplayName(tk: any, index: number): string {
  const patient = Array.isArray(tk.patients) ? tk.patients[0] : tk.patients
  if (patient?.first_name && patient?.last_name) {
    return `${slugify(patient.first_name)}-${slugify(patient.last_name)}-analysis-${index + 1}`
  }
  return `analysis-${tk.id.slice(0, 8)}`
}

export function TicketList({ tickets: initialTickets, showPatientName = false, doctorId, patientId, dict }: TicketListProps) {
  const router  = useRouter()
  const [tickets, setTickets] = useState(initialTickets)
  const supabase = createClient()
  const t = dict.dashboard.tickets

  useEffect(() => { setTickets(initialTickets) }, [initialTickets])

  useEffect(() => {
    let filter = ''
    if (patientId)      filter = `patient_id=eq.${patientId}`
    else if (doctorId)  filter = `doctor_id=eq.${doctorId}`
    else return

    const channel = supabase.channel(`realtime-list-${patientId || doctorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter }, (payload) => {
        if (payload.eventType === 'INSERT') router.refresh()
        else if (payload.eventType === 'UPDATE')
          setTickets((curr) => curr.map((tk) => tk.id === payload.new.id ? { ...tk, ...payload.new } : tk))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, router, patientId, doctorId])

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm">{t.empty}</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 overflow-hidden animate-in fade-in">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t.table.id}</th>
            {showPatientName && <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t.table.patient}</th>}
            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t.table.file}</th>
            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">{t.table.date}</th>
            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">{t.table.status}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.map((tk, idx) => (
            <tr
              key={tk.id}
              onClick={() => router.push(`/dashboard/ticket/${tk.id}`)}
              className="hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <td className="px-6 py-4 font-mono text-xs text-gray-500 group-hover:text-black">
                #{tk.id.slice(0, 8)}
              </td>
              {showPatientName && (
                <td className="px-6 py-4 font-bold text-gray-900">
                  {Array.isArray(tk.patients) ? tk.patients[0]?.first_name : tk.patients?.first_name}{' '}
                  {Array.isArray(tk.patients) ? tk.patients[0]?.last_name  : tk.patients?.last_name}
                </td>
              )}
              <td className="px-6 py-4">
                <span className="truncate max-w-[240px] font-mono text-xs text-gray-700 group-hover:text-black" title={getDisplayName(tk, idx)}>
                  {getDisplayName(tk, idx)}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-500 text-xs">
                {new Date(tk.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-6 py-4 text-right">
                <StatusBadge status={tk.status} dict={dict} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status, dict }: { status: string; dict: any }) {
  const t = dict.dashboard.tickets.status
  switch (status) {
    case 'COMPLETED':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3.5 h-3.5" /> {t.completed}</span>
    case 'PROCESSING':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.processing}</span>
    case 'QUEUED':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200"><Clock className="w-3.5 h-3.5" /> {t.queued}</span>
    case 'UPLOADING':
    case 'UPLOADED':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.uploading}</span>
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200"><AlertTriangle className="w-3.5 h-3.5" /> {t.error}</span>
  }
}
