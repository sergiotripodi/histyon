'use client'

import { useFormStatus } from 'react-dom'
import { ValidatedInput } from '@/components/ui/FormElements'
import { resetPassword }  from '@/lib/actions/auth'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      disabled={pending}
      className="btn-elegant w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {pending && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? 'Invio in corso…' : label}
    </button>
  )
}

export function ForgotPasswordForm({
  emailLabel,
  btnLabel,
}: {
  emailLabel: string
  btnLabel: string
}) {
  return (
    <form action={resetPassword} className="space-y-6">
      <ValidatedInput
        name="email"
        type="email"
        label={emailLabel}
        required
      />
      <SubmitButton label={btnLabel} />
    </form>
  )
}
