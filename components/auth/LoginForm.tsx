'use client'

import { useCallback, useState } from 'react'
import { login } from '@/lib/actions/auth'
import { ValidatedInput } from '@/components/ui/FormElements'
import { TurnstileWidget } from './TurnstileWidget'
import Link from 'next/link'

interface LoginFormProps {
  turnstileSiteKey?: string
  labels: {
    email: string
    password: string
    forgotPassword: string
    btn: string
  }
}

export function LoginForm({ turnstileSiteKey, labels }: LoginFormProps) {
  const [turnstileReady, setTurnstileReady] = useState(!turnstileSiteKey)

  const handleSuccess = useCallback(() => setTurnstileReady(true), [])
  const handleError = useCallback(() => setTurnstileReady(false), [])

  return (
    <form action={login} className="space-y-5" noValidate>
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

      {turnstileSiteKey && (
        <TurnstileWidget
          siteKey={turnstileSiteKey}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      <button
        type="submit"
        disabled={!turnstileReady}
        className="btn-elegant w-full py-3.5 mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {labels.btn}
      </button>
    </form>
  )
}
