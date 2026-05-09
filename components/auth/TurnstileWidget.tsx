'use client'

import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess?: () => void
  onError?: () => void
}

export function TurnstileWidget({ siteKey, onSuccess, onError }: TurnstileWidgetProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  return (
    <div className="flex flex-col gap-2">
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-gray-400 h-[65px] px-1">
          <span className="inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin shrink-0" />
          Verifica sicurezza in corso...
        </div>
      )}
      {state === 'error' && (
        <p className="text-xs text-red-500 px-1">
          Verifica non riuscita. Ricarica la pagina.
        </p>
      )}
      <Turnstile
        siteKey={siteKey}
        className={state === 'loading' ? 'hidden' : ''}
        options={{ theme: 'light', size: 'normal' }}
        onSuccess={() => {
          setState('ready')
          onSuccess?.()
        }}
        onError={() => {
          setState('error')
          onError?.()
        }}
        onExpire={() => {
          setState('loading')
          onError?.()
        }}
        onBeforeInteractive={() => setState('loading')}
        onAfterInteractive={() => setState('ready')}
      />
    </div>
  )
}
