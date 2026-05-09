'use client'

import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess?: () => void
  onError?: () => void
}

export function TurnstileWidget({ siteKey, onSuccess, onError }: TurnstileWidgetProps) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div>
      {!ready && !error && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-1.5 px-0.5">
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin shrink-0" />
          Verifica sicurezza in corso...
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500 px-0.5 py-1.5">
          Verifica non riuscita. Ricarica la pagina.
        </p>
      )}
      <Turnstile
        siteKey={siteKey}
        options={{ theme: 'light', size: 'normal' }}
        onSuccess={() => {
          setReady(true)
          setError(false)
          onSuccess?.()
        }}
        onError={() => {
          setError(true)
          onError?.()
        }}
        onExpire={() => {
          setReady(false)
          onError?.()
        }}
      />
    </div>
  )
}
