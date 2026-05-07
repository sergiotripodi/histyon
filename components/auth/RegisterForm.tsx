'use client'

import { useState, useActionState, useEffect } from 'react'
import { signup, SignupState } from '@/lib/actions/auth'
import { ValidatedInput } from '@/components/ui/FormElements'
import { GlobalLocationSelector } from '@/components/auth/GlobalLocationSelector'
import { PhoneInput } from '@/components/shared/PhoneInput'
import { DateOfBirthPicker } from '@/components/ui/DateOfBirthPicker'
import { AlertTriangle, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { REGEX_VALIDATORS } from '@/lib/constants'

const initialState: SignupState = { status: 'idle', inputs: {} }

function dobFromInputs(v: unknown): Date | undefined {
  if (typeof v !== 'string' || v.length < 10) return undefined
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

interface RegisterFormProps {
  dict: any
}

function StepOne({ state, dict, tf, dob, setDob, isActive }: any) {

    return (
        <div className={`${isActive ? 'block space-y-6 animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}`}>
            <div className="grid grid-cols-2 gap-4">
                <ValidatedInput name="firstName" label={tf.labels.firstName} pattern={REGEX_VALIDATORS.NAME} errorMessage={dict.validation.name} defaultValue={state.inputs?.firstName} required />
                <ValidatedInput name="lastName" label={tf.labels.lastName} pattern={REGEX_VALIDATORS.NAME} errorMessage={dict.validation.name} defaultValue={state.inputs?.lastName} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <ValidatedInput name="fiscalCode" label={tf.labels.fiscalCode} className="uppercase font-mono" maxLength={16} pattern={REGEX_VALIDATORS.FISCAL_CODE} errorMessage={dict.validation.fiscalCodeLen} defaultValue={state.inputs?.fiscalCode} required />
                <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{tf.labels.gender} *</label>
                    <select name="gender" required defaultValue={state.inputs?.gender || ""} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-gray-100 focus:border-black transition-all">
                        <option value="" disabled>{tf.placeholders.select}</option>
                        <option value="M">{tf.options.male}</option>
                        <option value="F">{tf.options.female}</option>
                    </select>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{tf.labels.dob} *</label>
                <DateOfBirthPicker date={dob} setDate={setDob} labels={{ day: tf.placeholders.day, month: tf.placeholders.month, year: tf.placeholders.year }} />
            </div>
            <ValidatedInput name="placeOfBirth" label={tf.labels.birthPlace} defaultValue={state.inputs?.placeOfBirth} required errorMessage={tf.warnings.required} />
            <PhoneInput label={tf.labels.phone} defaultValue={state.inputs?.phone} />
        </div>
    )
}

function StepTwo({ dict, isActive }: any) {
    return (
        <div className={`${isActive ? 'block space-y-6 animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}`}>
            <GlobalLocationSelector dict={dict} /> 
        </div>
    )
}

function StepThree({ state, dict, tf, isActive }: any) {
    return (
        <div className={`${isActive ? 'block space-y-6 animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}`}>
            <div className="grid grid-cols-2 gap-4">
                <ValidatedInput name="medicalLicense" label={tf.labels.medicalLicense} placeholder={tf.placeholders.license} defaultValue={state.inputs?.medicalLicense} required errorMessage={tf.warnings.required} />
                <ValidatedInput name="hospitalName" label={tf.labels.hospital} placeholder={tf.placeholders.hospital} defaultValue={state.inputs?.hospitalName} required errorMessage={tf.warnings.required} />
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    {tf.sections.credentials}
                </h3>
                <ValidatedInput name="email" type="email" label={tf.labels.email} pattern={REGEX_VALIDATORS.EMAIL} errorMessage={dict.validation.emailInvalid} defaultValue={state.inputs?.email} externalError={state.errors?.email} required />
                <ValidatedInput name="password" type="password" label={tf.labels.password} pattern={REGEX_VALIDATORS.PASSWORD} errorMessage={dict.validation.passwordRegexMsg} defaultValue={state.inputs?.password} externalError={state.errors?.password} required />
            </div>
        </div>
    )
}

export function RegisterForm({ dict }: RegisterFormProps) {
  const [state, formAction] = useActionState(signup, initialState)
  const [currentStep, setCurrentStep] = useState(1)
  
  const [dob, setDob] = useState<Date | undefined>(() => dobFromInputs(initialState.inputs?.dob))

  useEffect(() => {
    const next = dobFromInputs(state.inputs?.dob)
    if (next) setDob(next)
  }, [state.inputs?.dob])
  
  const t = dict.auth.register;
  const tf = dict.auth.form;

  const nextStep = () => { 
      setCurrentStep(prev => Math.min(prev + 1, 3)); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }
  const prevStep = () => { 
      setCurrentStep(prev => Math.max(prev - 1, 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <form action={formAction} className="flex flex-col h-full" noValidate>
        
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-5">
                {[1, 2, 3].map((step) => (
                    <div
                        key={step}
                        className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                            currentStep === step 
                                ? 'w-8 bg-black' 
                                : currentStep > step 
                                    ? 'w-6 bg-gray-300' 
                                    : 'w-4 bg-gray-100'
                        }`}
                    />
                ))}
            </div>

            <h2 className="font-serif text-3xl">
                {currentStep === 1 && t.steps.registry}
                {currentStep === 2 && t.steps.residence}
                {currentStep === 3 && t.steps.profession}
            </h2>
        </div>

        {state.status === 'error' && state.message && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-4 rounded-xl text-sm flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold">{tf.warnings.attention}</p>
                    <p>{state.message}</p>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-6">
            <StepOne state={state} dict={dict} tf={tf} dob={dob} setDob={setDob} isActive={currentStep === 1} />
            <StepTwo dict={dict} isActive={currentStep === 2} />
            <StepThree state={state} dict={dict} tf={tf} isActive={currentStep === 3} />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3">
            {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-elegant-soft flex-1 py-3.5 rounded-md font-bold">
                    <ArrowLeft className="w-4 h-4" /> {t.buttons.back}
                </button>
            )}
            {currentStep < 3 ? (
                <button type="button" onClick={nextStep} className="btn-elegant flex-[2] py-3.5 rounded-md font-bold">
                    {t.buttons.next} <ArrowRight className="w-4 h-4" />
                </button>
            ) : (
                <button type="submit" className="btn-elegant flex-[2] py-3.5 rounded-md font-bold">
                    {t.buttons.complete} <Check className="w-4 h-4" />
                </button>
            )}
        </div>
    </form>
  )
}