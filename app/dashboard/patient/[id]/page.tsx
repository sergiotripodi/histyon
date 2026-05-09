import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { TicketList } from '@/components/dashboard/TicketList'
import { InlineFileUploader } from '@/components/dashboard/InlineFileUploader'
import { DeletePatientModal } from '@/components/patients/DeletePatientModal'
import { getDictionary, getLocale } from '@/lib/dictionary'

export default async function PatientDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const dict = await getDictionary()
  const lang = await getLocale()
  const t = dict.dashboard

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('doctor_id', user.id)
    .single()

  if (!patient) return notFound()

  const { data: patientTickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('patient_id', id)
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="layout-container py-10 space-y-8">

      {/* Page header */}
      <div className="flex items-center gap-4 pb-8 border-b border-gray-100">
        <Link href="/dashboard/patients" className="p-2 border border-transparent hover:border-gray-200 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {patient.first_name} {patient.last_name}
          </h1>
          <span className="text-sm text-gray-500 font-mono mt-0.5 block">{patient.fiscal_code}</span>
        </div>
        <DeletePatientModal
          patientId={patient.id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          fiscalCode={patient.fiscal_code}
          ticketCount={patientTickets?.length ?? 0}
          dict={dict}
        />
      </div>

      {/* Profile info — always visible */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.tabs.profile}</span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-sm">
          <div className="space-y-1">
            <label className="block text-gray-400 text-xs uppercase font-bold tracking-wider">{t.profile.dob}</label>
            <p className="font-medium text-gray-900">
              {new Date(patient.date_of_birth).toLocaleDateString(lang === 'en' ? 'en-US' : 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="space-y-1">
            <label className="block text-gray-400 text-xs uppercase font-bold tracking-wider">{t.profile.birthPlace}</label>
            <p className="font-medium text-gray-900">
              {[patient.place_of_birth, patient.country].filter(Boolean).join(', ') || '-'}
            </p>
          </div>
          <div className="space-y-1">
            <label className="block text-gray-400 text-xs uppercase font-bold tracking-wider">{t.profile.residence}</label>
            <p className="font-medium text-gray-900">
              {patient.address_street
                ? `${patient.address_street}${patient.address_civic ? ` ${patient.address_civic}` : ''}`
                : patient.address || '-'}
            </p>
            <p className="text-gray-500">
              {[patient.postal_code, patient.city, patient.region || patient.province].filter(Boolean).join(' ')}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-gray-400 text-xs uppercase font-bold tracking-wider">{t.profile.contacts}</label>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> {patient.email || '-'}
            </p>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {patient.phone_number || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload + Analysis history */}
      <div>
        <div className="mb-5 pb-4 border-b border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.titles.uploadHistory}</span>
        </div>
        <InlineFileUploader patientId={patient.id} dict={dict} />
        <TicketList
          tickets={patientTickets || []}
          showPatientName={false}
          patientId={patient.id}
          dict={dict}
        />
      </div>

    </div>
  )
}
