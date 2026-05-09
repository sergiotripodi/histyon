'use client'

import { useEffect, useRef, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess?: () => void
  onError?: () => void
}

const TIMEOUT_MS = 12_000

export function TurnstileWidget({ siteKey, onSuccess, onError }: TurnstileWidgetProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'timeout'>('loading')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setState(prev => {
        if (prev === 'loading') {
          onSuccess?.()
          return 'timeout'
        }
        return prev
      })
    }, TIMEOUT_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [onSuccess])

  return (
    <div>
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-1.5 px-0.5">
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin shrink-0" />
          Verifica sicurezza in corso...
        </div>
      )}
      {state === 'timeout' && (
        <p className="text-xs text-amber-500 px-0.5 py-1.5">
          Verifica non completata — puoi procedere comunque.
        </p>
      )}
      {state === 'error' && (
        <p className="text-xs text-red-500 px-0.5 py-1.5">
          Verifica non riuscita. Ricarica la pagina.
        </p>
      )}
      <Turnstile
        siteKey={siteKey}
        options={{ theme: 'light', size: 'normal' }}
        onSuccess={() => {
          if (timerRef.current) clearTimeout(timerRef.current)
          setState('ready')
          onSuccess?.()
        }}
        onError={() => {
          if (timerRef.current) clearTimeout(timerRef.current)
          setState('error')
          onError?.()
        }}
        onExpire={() => {
          setState('loading')
          onError?.()
        }}
      />
    </div>
  )
}
