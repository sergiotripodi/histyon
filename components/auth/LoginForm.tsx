'use client'

import { login } from '@/lib/actions/auth'
import { ValidatedInput } from '@/components/ui/FormElements'
import Link from 'next/link'

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

      <button
        type="submit"
        className="btn-elegant w-full py-3.5 mt-4"
      >
        {labels.btn}
      </button>
    </form>
  )
}
