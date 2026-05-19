import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ViewerWrapper from '@/components/viewer/ViewerWrapper'
import { isSafeDziSource } from '@/lib/url-security'
import { getDziPublicUrl } from '@/lib/storage/supabase'
import { getDictionary } from '@/lib/dictionary'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Annotations } from '@/types'

export default async function ViewerPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dict = await getDictionary()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, output_dzi, annotations, patient_id, patients(first_name, last_name)')
    .eq('id', id)
    .eq('doctor_id', user.id)
    .single()

  if (!ticket || !ticket.output_dzi) redirect(`/dashboard/ticket/${id}`)

  // Costruisce l'URL pubblico del DZI dal path in Supabase Storage
  const rawPath = String(ticket.output_dzi).trim()
  let dziUrl: string

  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    // URL completo già salvato (backward compat)
    dziUrl = rawPath
  } else {
    dziUrl = getDziPublicUrl(rawPath)
  }

  if (!isSafeDziSource(dziUrl)) redirect(`/dashboard/ticket/${id}`)

  const patient     = Array.isArray(ticket.patients) ? ticket.patients[0] : ticket.patients
  const annotations = (ticket.annotations ?? null) as Annotations | null
  const t           = dict.dashboard.realtime

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a]">

      <div className="flex items-center gap-4 px-5 h-12 border-b border-white/8 shrink-0">
        <Link
          href={`/dashboard/ticket/${id}`}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-medium tracking-wide"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {patient ? `${patient.first_name} ${patient.last_name}` : 'Back'}
        </Link>
        <div className="flex-1" />
        <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
          #{id.slice(0, 8)}
        </span>
      </div>

      <main className="flex-1 relative overflow-hidden">
        <ViewerWrapper
          dziUrl={dziUrl}
          annotations={annotations}
          loadingText={t.loadingTissues}
        />
      </main>
    </div>
  )
}
