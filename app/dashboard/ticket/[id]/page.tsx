import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TicketRealtimeView } from '@/components/ticket/TicketRealTimeView'
import { getDictionary } from '@/lib/dictionary'

export const metadata = { title: 'Ticket' }

export default async function TicketPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
    <div className="layout-container py-10 space-y-8">

      <div className="flex items-center gap-4 pb-8 border-b border-gray-100">
        <Link
          href={`/dashboard/patient/${ticket.patient_id}`}
          className="p-2 border border-transparent hover:border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t.analysis} #{ticket.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t.patient}: <span className="font-bold text-black">{ticket.patients.first_name} {ticket.patients.last_name}</span>
          </p>
        </div>
      </div>

      <TicketRealtimeView initialTicket={ticket} dict={dict} />
    </div>
  )
}
