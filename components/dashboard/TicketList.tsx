'use client'

import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, AlertTriangle, Loader2, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TicketListProps {
  tickets: any[]
  showPatientName?: boolean
  doctorId?: string 
  patientId?: string
  dict: any
}

export function TicketList({ tickets: initialTickets, showPatientName = false, doctorId, patientId, dict }: TicketListProps) {
  const router = useRouter()
  const [tickets, setTickets] = useState(initialTickets)
  const supabase = createClient()
  const t = dict.dashboard.tickets;

  useEffect(() => {
    setTickets(initialTickets)
  }, [initialTickets])

  useEffect(() => {
    let filter = ''
    if (patientId) {
        filter = `patient_id=eq.${patientId}`
    } else if (doctorId) {
        filter = `doctor_id=eq.${doctorId}`
    } else {
        return
    }

    const channel = supabase.channel(`realtime-list-${patientId || doctorId}`)
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public', 
          table: 'tickets',
          filter: filter 
        },
        (payload) => {
           console.log('Realtime update:', payload)
           
           if (payload.eventType === 'INSERT') {
              router.refresh()
           } else if (payload.eventType === 'UPDATE') {
              setTickets((current) => 
                current.map((t) => t.id === payload.new.id ? { ...t, ...payload.new } : t)
              )
           }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, router, patientId, doctorId])

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm">{t.empty}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden font-sans animate-in fade-in">
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
          {tickets.map((t) => (
            <tr 
              key={t.id} 
              onClick={() => router.push(`/dashboard/ticket/${t.id}`)}
              className="hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <td className="px-6 py-4 font-mono text-xs text-gray-500 group-hover:text-black">
                #{t.id.slice(0, 8)}
              </td>
              
              {showPatientName && (
                <td className="px-6 py-4 font-bold text-gray-900">
                  {Array.isArray(t.patients) ? t.patients[0]?.first_name : t.patients?.first_name} {Array.isArray(t.patients) ? t.patients[0]?.last_name : t.patients?.last_name}
                </td>
              )}
              
              <td className="px-6 py-4 text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                <span className="truncate max-w-[150px] font-medium" title={t.file_name}>
                    {t.file_name}
                </span>
              </td>
              
              <td className="px-6 py-4 text-gray-500 text-xs">
                {new Date(t.created_at).toLocaleString('it-IT', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                })}
              </td>
              
              <td className="px-6 py-4 text-right">
                <StatusBadge status={t.status} dict={dict} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status, dict }: { status: string, dict: any }) {
  const t = dict.dashboard.tickets.status;
  switch (status) {
    case 'COMPLETED':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100"><CheckCircle2 className="w-3.5 h-3.5"/> {t.completed}</span>
    case 'PROCESSING':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 animate-pulse"><Loader2 className="w-3.5 h-3.5 animate-spin"/> {t.processing}</span>
    case 'QUEUED':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100"><Clock className="w-3.5 h-3.5"/> {t.queued}</span>
    case 'UPLOADING':
    case 'UPLOADED': 
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200"><Loader2 className="w-3.5 h-3.5 animate-spin"/> {t.uploading}</span>
    default: 
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100"><AlertTriangle className="w-3.5 h-3.5"/> {t.error}</span>
  }
}