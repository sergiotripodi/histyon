'use client'

import { useState, useTransition } from 'react'
import { updateProfile, updateEmail, updatePassword } from '@/lib/actions/settings'
import { User, Lock, Building2, MapPin, Save, Loader2, AlertCircle, CheckCircle2, Mail, KeyRound, ShieldCheck } from 'lucide-react'
import { DateOfBirthPicker } from '@/components/ui/DateOfBirthPicker'
import { ValidatedInput } from '../ui/FormElements'
import { GlobalLocationSelector } from '../auth/GlobalLocationSelector'
import { PhoneInput } from '../shared/PhoneInput'

interface SettingsFormProps {
  user: any
  profile: any
  dict: any
}

export function SettingsForm({ user, profile, dict }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ section: string, type: 'success' | 'error', text: string } | null>(null)
  
  const d = dict.dashboard.settings
  const f = dict.auth.form 

  const handleSubmit = async (action: Function, formData: FormData, section: string) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await action(formData)
      if (res.error) setFeedback({ section, type: 'error', text: res.error })
      else {
        setFeedback({ section, type: 'success', text: res.message || d.form.success })
        if (section === 'password') (document.getElementById('password-form') as HTMLFormElement)?.reset()
      }
    })
  }

  const labelClass = "text-sm font-semibold text-gray-700 block mb-2"

  return (
    <div className="w-full">
      
      <div className="flex gap-1 p-1 bg-white rounded-md w-fit mb-8 border border-gray-200">
        <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'profile' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <User className="w-4 h-4" /> {d.tabs.profile}
        </button>
        <button 
            onClick={() => setActiveTab('security')} 
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-sm transition-all ${activeTab === 'security' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          <ShieldCheck className="w-4 h-4" /> {d.tabs.security}
        </button>
      </div>

      {activeTab === 'profile' && (
        <form action={(fd) => handleSubmit(updateProfile, fd, 'profile')} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {feedback?.section === 'profile' && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
              {feedback.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 shadow-sm">
                        <User className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{d.sections.personal}</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <ValidatedInput name="firstName" label={f.labels.firstName} defaultValue={profile?.first_name} required />
                        <ValidatedInput name="lastName" label={f.labels.lastName} defaultValue={profile?.last_name} required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <PhoneInput label={f.labels.phone} defaultValue={profile?.phone_number} />
                        <ValidatedInput name="placeOfBirth" label={f.labels.birthPlace} defaultValue={profile?.place_of_birth} />
                    </div>
                    <div>
                        <label className={labelClass}>{f.labels.dob}</label>
                        <DateOfBirthPicker 
                            name="birth_date" 
                            dict={dict} 
                            defaultDate={profile?.date_of_birth} 
                        />
                    </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 shadow-sm">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{d.sections.residence}</h3>
                </div>
                <div className="p-6">
                    <GlobalLocationSelector 
                        dict={dict} 
                        defaults={{
                            country: profile?.country,
                            addressStreet: profile?.address_street,
                            addressCivic: profile?.address_civic,
                            postalCode: profile?.postal_code,
                            city: profile?.city,
                            region: profile?.province
                        }} 
                    />
                </div>
              </div>
            </div>

            <div className="space-y-8 flex flex-col h-full">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 shadow-sm">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">{d.sections.professional}</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <ValidatedInput name="hospitalName" label={f.labels.hospital} defaultValue={profile?.hospital_name} />
                        <ValidatedInput name="medicalLicense" label={f.labels.medicalLicense} defaultValue={profile?.medical_license_number} />
                    </div>
                </div>
                
                <div className="sticky bottom-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="btn-elegant w-full py-3.5"
                    >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                        {isPending ? d.form.updating : d.form.updateBtn}
                    </button>
                </div>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300 items-stretch">
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 shadow-sm">
                    <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{d.sections.email}</h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
                {feedback?.section === 'email' && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {feedback.text}
                    </div>
                )}
                
                <form action={(fd) => handleSubmit(updateEmail, fd, 'email')} className="flex-1 flex flex-col">
                    <div className="space-y-6 flex-1">
                        <ValidatedInput name="email" label={f.labels.email} defaultValue={user.email} />
                        
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-600 text-sm flex gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 text-gray-400" />
                            <p>{d.form.emailNotice}</p>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isPending}
                        className="btn-elegant-soft w-full mt-8 py-3"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isPending ? d.form.updating : d.form.updateBtn}
                    </button>
                </form>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-700 shadow-sm">
                    <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{d.sections.password}</h3>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {feedback?.section === 'password' && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {feedback.text}
                    </div>
                )}

                <form id="password-form" action={(fd) => handleSubmit(updatePassword, fd, 'password')} className="flex-1 flex flex-col">
                    <div className="space-y-6 flex-1">
                        <ValidatedInput name="password" type="password" label={d.form.newPassword} placeholder="••••••••" />
                        <ValidatedInput name="confirm_password" type="password" label={d.form.confirmPassword} placeholder="••••••••" />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isPending}
                        className="btn-elegant w-full mt-8 py-3"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isPending ? d.form.updating : d.form.savePassword}
                    </button>
                </form>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}