'use client'

import { login } from '@/lib/actions/auth'
import { ValidatedInput } from '@/components/ui/FormElements'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-elegant w-full py-3.5 mt-4 flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {pending && (
        <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? 'Accesso in corso…' : label}
    </button>
  )
}

interface LoginFormProps {
  labels: {
    email: string
    password: string
    forgotPassword: string
    btn: string
  }
}

export function LoginForm({ labels }: LoginFormProps) {
  return (
    <form action={login} className="space-y-5" noValidate>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0 }}
      />

      <ValidatedInput
        name="email"
        type="email"
        label={labels.email}
        required
      />

      <div className="space-y-1">
        <ValidatedInput
          name="password"
          type="password"
          label={labels.password}
          required
        />
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-xs font-semibold text-gray-500 hover:text-black transition-colors"
          >
            {labels.forgotPassword}
          </Link>
        </div>
      </div>

      <SubmitButton label={labels.btn} />
    </form>
  )
}
