import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TicketRealtimeView } from '@/components/ticket/TicketRealTimeView'
import { getDictionary } from '@/lib/dictionary'

export default async function TicketPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dict = await getDictionary()
  const t = dict.dashboard.tickets.detail

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, patients(*)')
    .eq('id', id)
    .eq('doctor_id', user.id)
    .single()

  if (!ticket) return notFound()

  return (
    <div className="layout-container py-8 space-y-8">      
      <div className="flex items-center gap-4">
        <Link 
            href={`/dashboard/patient/${ticket.patient_id}?tab=analysis`}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                {t.analysis} #{ticket.id.slice(0, 8)}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
                {t.patient}: <span className="font-bold text-black">{ticket.patients.first_name} {ticket.patients.last_name}</span>
            </p>
        </div>
      </div>

      <TicketRealtimeView initialTicket={ticket} dict={dict} />
    </div>
  )
}