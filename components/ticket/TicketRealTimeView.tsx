'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HardDrive, BrainCircuit, FileText, Server, RefreshCw, Activity, Maximize2, FolderArchive } from 'lucide-react'
import { StatusTimeline } from '@/components/ticket/StatusTimeline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getTicketProjectDownloadUrl } from '@/lib/actions/storage'

interface RealTimeProps {
    initialTicket: any
    dict: any
}

export function TicketRealtimeView({ initialTicket, dict }: RealTimeProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [isDownloadingProject, setIsDownloadingProject] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const t = dict.dashboard.realtime;

  const status = (ticket.status || 'UPLOADING').toUpperCase().trim()
  const isError = ['ERROR', 'FAILED', 'FAIL'].includes(status)
  const isCompleted = status === 'COMPLETED'
  const isProcessing = !isError && !isCompleted

  useEffect(() => {
    const channel = supabase.channel(`ticket-view-${ticket.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticket.id}` },
        (payload) => {
          setTicket(payload.new)
          if (payload.new.status === 'COMPLETED') router.refresh()
        }
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ticket.id, supabase, router])

  const handleProjectDownload = async () => {
    if (!ticket.project_file_url) return
    setIsDownloadingProject(true)
    try {
      const res = await getTicketProjectDownloadUrl(ticket.id)
      if (res.success && 'url' in res && res.url) {
        const link = document.createElement('a')
        link.href = res.url
        link.setAttribute('download', 'qupath_project.zip')
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsDownloadingProject(false)
    }
  }

  const getBoxClasses = () => {
    if (isError) return 'tint-elegant border-red-200 from-red-50/70 to-white text-red-900'
    if (isCompleted) return 'tint-elegant border-emerald-200 from-emerald-50/70 to-white text-emerald-900'
    if (status === 'PROCESSING') return 'tint-elegant border-amber-200 from-amber-50/70 to-white text-amber-900'
    return 'tint-elegant border-gray-200 from-gray-50 to-white text-gray-700'
  }

  const stats = ticket.ai_results?.summary;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm w-full">
         <StatusTimeline status={status} dict={dict} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
         <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-sm text-gray-900">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-400 uppercase tracking-widest text-xs">
                    <HardDrive className="w-4 h-4" /> Dati Sorgente
                </h3>
                <div className="space-y-3">
                    <p className="font-mono break-all bg-gray-50 p-2 rounded-lg border text-xs">{ticket.file_name}</p>
                    <div className="flex justify-between font-medium">
                        <span>{(ticket.file_size / (1024*1024)).toFixed(2)} MB</span>
                        <span suppressHydrationWarning>{new Date(ticket.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Note Cliniche
                </h3>
                <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 flex-grow text-sm italic text-gray-700">
                    {ticket.notes || "Nessuna nota presente."}
                </div>
            </div>
         </div>

         <div className="lg:col-span-2 h-full">
            <div className={`p-8 rounded-2xl h-full flex flex-col transition-all duration-500 border ${getBoxClasses()}`}>
                <h3 className="font-serif text-3xl mb-8 tracking-tight">
                    {isError ? "Analisi Interrotta" : isCompleted ? "Report Disponibile" : "Analisi AI in corso..."}
                </h3>

                {isCompleted && (
                    <div className="space-y-8 flex-1 flex flex-col justify-center">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link 
                                href={`/dashboard/viewer/${ticket.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-elegant flex items-center justify-center gap-3 px-6 py-4 rounded-md font-bold"
                            >
                                <Maximize2 className="w-5 h-5 text-green-600" />
                                APRI VISUALIZZATORE
                            </Link>

                            <button 
                                onClick={handleProjectDownload}
                                disabled={isDownloadingProject || !ticket.project_file_url}
                                className="btn-elegant flex items-center justify-center gap-3 px-6 py-4 rounded-md font-bold"
                            >
                                {isDownloadingProject ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FolderArchive className="w-5 h-5 text-blue-600" />}
                                DOWNLOAD QUPATH
                            </button>
                        </div>

                        <div className="pt-6 border-t border-current/15">
                            <h4 className="text-xs uppercase tracking-widest font-bold opacity-80 flex items-center gap-2 mb-4">
                                <Activity className="w-4 h-4" /> Statistiche Tessutali
                            </h4>
                            {stats ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="bg-white p-4 rounded-md border border-current/15">
                                        <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Tessuto Malato</p>
                                        <p className="text-2xl font-bold">{stats.percentuale_tessuto_malato?.toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-md border border-current/15">
                                        <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Glomeruli Totali</p>
                                        <p className="text-2xl font-bold">{stats.counts?.glomeruli || 0}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-md border border-current/15">
                                        <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Glom. Sclerotici</p>
                                        <p className="text-2xl font-bold">{stats.counts?.glomeruli_sclerotici || 0}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm opacity-60 italic py-4 text-center">Dati quantitativi non estratti.</p>
                            )}
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-md bg-white border border-current/20 flex items-center justify-center">
                            {status === 'PROCESSING' ? <BrainCircuit className="w-10 h-10 animate-pulse" /> : <Server className="w-10 h-10" />}
                        </div>
                        <p className="text-xl font-bold uppercase tracking-tight">Elaborazione in corso...</p>
                    </div>
                )}
            </div>
         </div>
      </div>
    </div>
  )
}