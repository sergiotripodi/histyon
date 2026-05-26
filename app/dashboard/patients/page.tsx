import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientList } from '@/components/patients/PatientList'
import { AddPatientModal } from '@/components/patients/AddPatientModal'
import { Pagination } from '@/components/shared/Pagination'
import { getDictionary } from '@/lib/dictionary'

export const metadata = { title: 'Pazienti' }

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function PatientsPage(props: {
  searchParams: Promise<{ page?: string }>
}) {
  const dict = await getDictionary()
  const t = dict.dashboard

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const sp   = await props.searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const { data: patients, count } = await supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const total      = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="layout-container py-10">
      <div className="flex items-end justify-between pb-8 mb-8 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.tabs.patients}</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {total === 0
              ? 'Nessun paziente registrato'
              : `${total} ${total === 1 ? 'paziente registrato' : 'pazienti registrati'}`}
          </p>
        </div>
        <AddPatientModal dict={dict} />
      </div>

      <PatientList patients={patients || []} dict={dict} />

      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/patients" />
    </div>
  )
}
