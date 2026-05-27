'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, User, MapPin, Building2, ShieldCheck, Save, Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { updateProfile, updateEmail, updatePassword } from '@/lib/actions/settings'
import { DeleteAccountModal } from './DeleteAccountModal'
import { DateOfBirthPicker } from '@/components/ui/DateOfBirthPicker'
import { ValidatedInput } from '../ui/FormElements'
import { GlobalLocationSelector } from '../auth/GlobalLocationSelector'
import { PhoneInput } from '../shared/PhoneInput'

interface SettingsFormProps {
  user: any
  profile: any
  dict: any
  mfaFactor: { created_at: string } | null
}

interface AccordionProps {
  id: string
  icon: any
  title: string
  isOpen: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}

function AccordionSection({ id, icon: Icon, title, isOpen, onToggle, children }: AccordionProps) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-sm font-semibold text-gray-900 tracking-wide">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-7 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

function InlineFeedback({ section, feedback }: { section: string; feedback: any }) {
  if (!feedback || feedback.section !== section) return null
  const ok = feedback.type === 'success'
  return (
    <div className={`mb-5 p-4 flex items-center gap-3 text-sm font-medium border ${ok ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
      {feedback.text}
    </div>
  )
}

// ─── Password sub-form (needs its own state for the checkbox) ─────────────────

function PasswordForm({
  isPending,
  d,
  onSubmit,
}: {
  isPending: boolean
  d: any
  onSubmit: (fd: FormData) => void
}) {
  const [signOutOthers, setSignOutOthers] = useState(true)

  return (
    <form
      id="password-form"
      action={(fd: FormData) => {
        // Manually inject the checkbox value (HTML checkboxes omit the field when unchecked)
        if (signOutOthers) fd.set('signOutOthers', 'on')
        onSubmit(fd)
      }}
      className="space-y-4"
    >
      <ValidatedInput name="password"          type="password" label={d.form.newPassword}    placeholder="••••••••" />
      <ValidatedInput name="confirm_password"  type="password" label={d.form.confirmPassword} placeholder="••••••••" />

      {/* Sign-out-all checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group select-none">
        <input
          type="checkbox"
          checked={signOutOthers}
          onChange={e => setSignOutOthers(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-gray-900 shrink-0 cursor-pointer"
        />
        <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors leading-relaxed">
          Disconnetti tutte le altre sessioni attive
          <span className="block text-[11px] text-gray-400 mt-0.5">
            Gli altri dispositivi in cui sei connesso verranno scollegati automaticamente.
          </span>
        </span>
      </label>

      <button type="submit" disabled={isPending} className="btn-elegant py-2.5 px-5">
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {isPending ? d.form.updating : d.form.savePassword}
      </button>
    </form>
  )
}

// ─── Main settings form ───────────────────────────────────────────────────────

export function SettingsForm({ user, profile, dict, mfaFactor }: SettingsFormProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['personal']))
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ section: string; type: 'success' | 'error'; text: string } | null>(null)

  const d = dict.dashboard.settings
  const f = dict.auth.form

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  return (
    <div className="w-full">
      <InlineFeedback section="profile" feedback={feedback} />

      <div className="bg-white border border-gray-200">

        {/* === Profile form wraps sections 1-3 === */}
        <form action={(fd) => handleSubmit(updateProfile, fd, 'profile')}>

          <AccordionSection id="personal" icon={User} title={d.sections.personal} isOpen={openSections.has('personal')} onToggle={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ValidatedInput name="firstName" label={f.labels.firstName} defaultValue={profile?.first_name} required />
              <ValidatedInput name="lastName" label={f.labels.lastName} defaultValue={profile?.last_name} required />
              <PhoneInput label={f.labels.phone} defaultValue={profile?.phone_number} />
              <ValidatedInput name="placeOfBirth" label={f.labels.birthPlace} defaultValue={profile?.place_of_birth} />
            </div>
            <div className="mt-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{f.labels.dob}</label>
              <DateOfBirthPicker name="birth_date" dict={dict} defaultDate={profile?.date_of_birth} />
            </div>
          </AccordionSection>

          <AccordionSection id="residence" icon={MapPin} title={d.sections.residence} isOpen={openSections.has('residence')} onToggle={toggleSection}>
            <GlobalLocationSelector
              dict={dict}
              defaults={{
                country: profile?.country,
                addressStreet: profile?.address_street,
                addressCivic: profile?.address_civic,
                postalCode: profile?.postal_code,
                city: profile?.city,
                region: profile?.province,
              }}
            />
          </AccordionSection>

          <AccordionSection id="professional" icon={Building2} title={d.sections.professional} isOpen={openSections.has('professional')} onToggle={toggleSection}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ValidatedInput name="hospitalName" label={f.labels.hospital} defaultValue={profile?.hospital_name} />
              <ValidatedInput name="medicalLicense" label={f.labels.medicalLicense} defaultValue={profile?.medical_license_number} />
            </div>
          </AccordionSection>

          {/* Profile save */}
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
            <button type="submit" disabled={isPending} className="btn-elegant py-2.5 px-6">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isPending ? d.form.updating : d.form.updateBtn}
            </button>
          </div>

        </form>

        {/* === Security section — separate forms, outside profile form === */}
        <AccordionSection id="security" icon={ShieldCheck} title={d.sections.security} isOpen={openSections.has('security')} onToggle={toggleSection}>
          <div className="space-y-8">

            {/* Email */}
            <div>
              <InlineFeedback section="email" feedback={feedback} />
              <form action={(fd) => handleSubmit(updateEmail, fd, 'email')} className="space-y-4">
                <ValidatedInput name="email" label={f.labels.email} defaultValue={user.email} />
                <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 p-4 text-sm text-gray-500">
                  <AlertCircle className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
                  <p>{d.form.emailNotice}</p>
                </div>
                <button type="submit" disabled={isPending} className="btn-elegant-soft py-2.5 px-5">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? d.form.updating : d.form.updateBtn}
                </button>
              </form>
            </div>

            {/* Password */}
            <div className="border-t border-gray-100 pt-7">
              <InlineFeedback section="password" feedback={feedback} />
              <PasswordForm isPending={isPending} d={d} onSubmit={(fd) => handleSubmit(updatePassword, fd, 'password')} />
            </div>

            {/* 2FA */}
            {mfaFactor && (
              <div className="border-t border-gray-100 pt-7">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Verifica in due passaggi (2FA)</p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold tracking-wide select-none">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Attivo
                  </span>
                  <span className="text-xs text-gray-400">
                    Attivata il{' '}
                    {new Date(mfaFactor.created_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}

          </div>
        </AccordionSection>

        {/* === Danger Zone — same accordion style, red tones === */}
        <div className="border-t border-red-100">
          <button
            type="button"
            onClick={() => toggleSection('danger')}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-red-50/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors" />
              <span className="text-sm font-semibold text-red-600 tracking-wide">{d.danger.title}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-red-300 transition-transform duration-200 ${openSections.has('danger') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has('danger') && (
            <div className="px-6 pb-7 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-xs text-gray-400 mb-5">{d.danger.subtitle}</p>
              <DeleteAccountModal dict={dict} />
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
