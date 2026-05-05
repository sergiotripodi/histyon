'use client'

import Link from 'next/link'
import { User, MapPin, Calendar, ArrowRight } from 'lucide-react'

interface Patient {
  id: string
  first_name: string
  last_name: string
  fiscal_code: string
  city: string | null
  province: string | null
  date_of_birth: string
}

interface PatientListProps {
  patients: Patient[]
  dict: any
}

export function PatientList({ patients, dict }: PatientListProps) {
  const t = dict.dashboard.patients;

  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50">
        <div className="bg-white p-3 rounded-full inline-flex mb-3 shadow-sm">
           <User className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">{t.empty.title}</p>
        <p className="text-sm text-gray-400">{t.empty.subtitle}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {patients.map((patient) => (
        <Link 
          key={patient.id} 
          href={`/dashboard/patient/${patient.id}`}
          className="group bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-black hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-2">
               <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                 <User className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-mono text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                 {patient.fiscal_code}
               </span>
            </div>
            
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {patient.first_name} {patient.last_name}
            </h3>
            
            <div className="space-y-1 mt-4">
               <div className="flex items-center gap-2 text-xs text-gray-500">
                 <Calendar className="w-3.5 h-3.5" />
                 {new Date(patient.date_of_birth).toLocaleDateString(dict === 'en' ? 'en-US' : 'it-IT')}
               </div>
               <div className="flex items-center gap-2 text-xs text-gray-500">
                 <MapPin className="w-3.5 h-3.5" />
                 {patient.city || 'N/A'} ({patient.province || '-'})
               </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
             <span className="text-xs font-bold text-gray-400 group-hover:text-black transition-colors">{t.card.openFolder}</span>
             <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black -translate-x-2 group-hover:translate-x-0 transition-all" />
          </div>
        </Link>
      ))}
    </div>
  )
}