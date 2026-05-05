import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, FileText, Activity } from 'lucide-react'
import Link from 'next/link'
import { TicketList } from '@/components/dashboard/TicketList'
import { InlineFileUploader } from '@/components/dashboard/InlineFileUploader'
import { getDictionary, getLocale } from '@/lib/dictionary'

export default async function PatientDetailPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const dict = await getDictionary();
  const lang = await getLocale(); 
  
  const t = dict.dashboard;

  const { id } = params
  const tab = typeof searchParams.tab === 'string' ? searchParams.tab : 'analysis' 

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
    <div className="layout-container py-8 space-y-8 relative min-h-screen">      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard?tab=patients" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-transparent hover:border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {patient.first_name} {patient.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-sm font-mono bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                {patient.fiscal_code}
                </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8" aria-label="Tabs">
          <Link 
             href="?tab=analysis" 
             scroll={false}
             className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${tab === 'analysis' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
             <Activity className="w-4 h-4" /> {t.titles.uploadHistory}
          </Link>
          <Link 
             href="?tab=profile" 
             scroll={false}
             className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${tab === 'profile' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
             <FileText className="w-4 h-4" /> {t.tabs.profile}
          </Link>
        </nav>
      </div>

      {tab === 'analysis' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
           <InlineFileUploader patientId={patient.id} dict={dict} />
           <div className="mt-8">
              <h3 className="font-bold text-gray-900 text-lg mb-4">{t.titles.uploadHistory}</h3>
              <TicketList 
                tickets={patientTickets || []} 
                showPatientName={false} 
                patientId={patient.id}
                dict={dict}
              />
           </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
           <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
             <div className="w-1 h-6 bg-black rounded-full"></div>
             {t.titles.patientFolder}
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 text-sm">
             <div className="space-y-1">
               <label className="block text-gray-400 text-xs uppercase font-bold tracking-wider">{t.profile.dob}</label>
               <p className="font-medium text-gray-900 text-base">
                 {/* FIX: Uso 'lang' invece di 'dict' per il confronto stringa */}
                 {new Date(patient.date_of_birth).toLocaleDateString(lang === 'en' ? 'en-US' : 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
               </p>
             </div>
             <div className="space-y-1">
               <label className="block text-gray-400 text-xs uppercase font-bold tracking-wider">{t.profile.birthPlace}</label>
               <p className="font-medium text-gray-900 text-base">
                 {patient.place_of_birth}, {patient.country}
               </p>
             </div>
             <div className="space-y-1">
               <label className="block text-gray-400 text-xs uppercase font-bold tracking-wider">{t.profile.residence}</label>
               <p className="font-medium text-gray-900 text-base">{patient.address}</p>
               <p className="text-gray-500">{patient.postal_code} {patient.city} ({patient.region || patient.province})</p>
             </div>
             <div className="space-y-1">
                <label className="block text-gray-400 text-xs uppercase font-bold tracking-wider">{t.profile.contacts}</label>
                <p className="font-medium text-gray-900 text-base flex items-center gap-2">
                    <span className="text-gray-400">@</span> {patient.email || '-'}
                </p>
                <p className="font-medium text-gray-900 text-base flex items-center gap-2">
                    <span className="text-gray-400">Tel.</span> {patient.phone_number || '-'}
                </p>
            </div>
           </div>
        </div>
      )}
    </div>
  )
}