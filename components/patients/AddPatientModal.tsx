'use client'

import { useState } from 'react'
import { Plus, X, User, MapPin, AlertCircle, Phone } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { addPatient } from '@/lib/actions/patient'
import { DateOfBirthPicker } from '@/components/ui/DateOfBirthPicker'
import { ValidatedInput } from '../ui/FormElements'
import { GlobalLocationSelector } from '../auth/GlobalLocationSelector'
import { PhoneInput } from '../shared/PhoneInput'
import { REGEX_VALIDATORS } from '@/lib/constants'

interface ModalProps {
    dict: any
}

function SubmitButton({ dict }: { dict: any }) {
  const { pending } = useFormStatus()
  const t = dict.dashboard.patients.modal;
  return (
    <button disabled={pending} className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 mt-6 shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]">
      {pending ? t.btnSaving : t.btnSave}
    </button>
  )
}

export function AddPatientModal({ dict }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [dob, setDob] = useState<Date | undefined>(undefined)

  const t = dict.dashboard.patients.modal;
  const tf = dict.auth.form;
  const tPatients = dict.dashboard.patients.empty;
  
  async function handleSubmit(formData: FormData) {
     setError(null) 
     const res = await addPatient(null, formData);
     
     if(res?.success) {
        setIsOpen(false);
        setError(null);
        setDob(undefined);
     }
     
     if(res?.error) {
        setError(res.error);
     }
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-900 transition-shadow shadow-sm">
        <Plus className="w-4 h-4" /> {tPatients.btnNew}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-hide relative">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-2xl tracking-tight">{t.title}</h3>
            <p className="text-sm text-gray-500">{t.subtitle}</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
        )}

        <form action={handleSubmit} className="space-y-6" noValidate>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> {tf.sections.identity}
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <ValidatedInput name="firstName" label={tf.labels.firstName} placeholder={tf.placeholders.name} required />
                <ValidatedInput name="lastName" label={tf.labels.lastName} placeholder={tf.placeholders.surname} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <ValidatedInput name="fiscalCode" label={tf.labels.fiscalCode} className="uppercase font-mono" maxLength={16} placeholder={tf.placeholders.cf} required />
                <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{tf.labels.gender} *</label>
                    <select name="gender" required defaultValue="" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-gray-100 transition-all">
                        <option value="" disabled>{tf.placeholders.select}</option>
                        <option value="M">{tf.options.male}</option>
                        <option value="F">{tf.options.female}</option>
                        <option value="OTHER">{tf.options.other}</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{tf.labels.dob} *</label>
                 
                 <DateOfBirthPicker 
                    date={dob} 
                    setDate={setDob}
                    labels={{
                        day: tf.placeholders.day,
                        month: tf.placeholders.month,
                        year: tf.placeholders.year
                    }}
                 />
                 <input type="hidden" name="dob" value={dob ? dob.toISOString().split('T')[0] : ''} />
            </div>
            
            <ValidatedInput name="placeOfBirth" label={tf.labels.birthPlace} placeholder={tf.placeholders.city} required />
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-4">
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4" /> {tf.sections.contacts}
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <ValidatedInput 
                    name="email" 
                    label={tf.labels.emailSimple} 
                    type="email" 
                    placeholder={tf.placeholders.emailPlaceholder} 
                    pattern={REGEX_VALIDATORS.EMAIL}
                    errorMessage={dict.validation.emailInvalid}
                    required 
                />
                <PhoneInput label="Telefono" />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" /> {tf.sections.domicile}
            </h4>
            <GlobalLocationSelector dict={dict} />
          </div>

          <SubmitButton dict={dict} />
        </form>
      </div>
    </div>
  )
}