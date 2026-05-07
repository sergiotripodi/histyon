import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TicketList } from '@/components/dashboard/TicketList'
import { getDictionary } from '@/lib/dictionary'

export default async function AnalysisPage() {
  const dict = await getDictionary()
  const t = dict.dashboard

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: allTickets } = await supabase
    .from('tickets')
    .select('*, patients(first_name, last_name)')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })

  const count = allTickets?.length ?? 0

  return (
    <div className="layout-container py-10">
      <div className="pb-8 mb-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.tabs.analysis}</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          {count === 0 ? 'Nessuna analisi disponibile' : `${count} ${count === 1 ? 'analisi totale' : 'analisi totali'}`}
        </p>
      </div>
      <TicketList
        tickets={allTickets || []}
        showPatientName={true}
        doctorId={user.id}
        dict={dict}
      />
    </div>
  )
}
