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
  const t = dict.dashboard.patients

  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-gray-200 bg-white">
        <div className="bg-gray-50 border border-gray-200 p-3 inline-flex mb-3">
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
          className="group bg-white p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gray-100 p-2 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase bg-gray-50 px-2 py-1 border border-gray-100">
                {patient.fiscal_code}
              </span>
            </div>

            <h3 className="font-bold text-lg text-gray-900 mb-1 tracking-tight">
              {patient.first_name} {patient.last_name}
            </h3>

            <div className="space-y-1.5 mt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(patient.date_of_birth).toLocaleDateString('it-IT')}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                {patient.city || 'N/A'}{patient.province ? ` (${patient.province})` : ''}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900 transition-colors uppercase tracking-wider">
              {t.card.openFolder}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 -translate-x-1 group-hover:translate-x-0 transition-all" />
          </div>
        </Link>
      ))}
    </div>
  )
}
