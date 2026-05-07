import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientList } from '@/components/patients/PatientList'
import { AddPatientModal } from '@/components/patients/AddPatientModal'
import { getDictionary } from '@/lib/dictionary'

export default async function DashboardPage() {
  const dict = await getDictionary()
  const t = dict.dashboard

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })

  const count = patients?.length ?? 0

  return (
    <div className="layout-container py-10">
      <div className="flex items-end justify-between pb-8 mb-8 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.tabs.patients}</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {count === 0 ? 'Nessun paziente registrato' : `${count} ${count === 1 ? 'paziente registrato' : 'pazienti registrati'}`}
          </p>
        </div>
        <AddPatientModal dict={dict} />
      </div>
      <PatientList patients={patients || []} dict={dict} />
    </div>
  )
}
