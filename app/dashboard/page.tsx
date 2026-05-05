import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientList } from '@/components/patients/PatientList'
import { AddPatientModal } from '@/components/patients/AddPatientModal'
import { TicketList } from '@/components/dashboard/TicketList'
import { Users, Activity } from 'lucide-react'
import Link from 'next/link'
import { getDictionary } from '@/lib/dictionary'

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const tab = typeof searchParams.tab === 'string' ? searchParams.tab : 'patients'
  
  const dict = await getDictionary();
  const t = dict.dashboard;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })

  const { data: allTickets } = await supabase
    .from('tickets')
    .select('*, patients(first_name, last_name)') 
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="layout-container py-8 space-y-8">      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t.titles.main}</h1>
        </div>
        
        <div className="bg-gray-100 p-1 rounded-xl flex items-center font-medium text-sm">
           <Link href="?tab=patients" scroll={false} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${tab === 'patients' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}>
             <Users className="w-4 h-4" /> {t.tabs.patients}
           </Link>
           <Link href="?tab=analysis" scroll={false} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${tab === 'analysis' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}>
             <Activity className="w-4 h-4" /> {t.tabs.analysis}
           </Link>
        </div>
      </div>

      {tab === 'patients' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{t.titles.patientRegistry}</h2>
              <AddPatientModal dict={dict} />
           </div>
           <PatientList patients={patients || []} dict={dict} />
        </div>
      )}

      {tab === 'analysis' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{t.titles.globalHistory}</h2>
           </div>
           <TicketList 
                tickets={allTickets || []} 
                showPatientName={true} 
                doctorId={user.id} 
                dict={dict}
           />
        </div>
      )}
    </div>
  )
}