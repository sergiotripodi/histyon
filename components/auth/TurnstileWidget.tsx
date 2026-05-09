'use client'

import { useEffect, useRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess?: () => void
  onError?: () => void
}

export function TurnstileWidget({ siteKey, onSuccess, onError }: TurnstileWidgetProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Safety fallback: if Cloudflare doesn't respond in 15s, unblock the user
    timerRef.current = setTimeout(() => onSuccess?.(), 15_000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [onSuccess])

  return (
    <Turnstile
      siteKey={siteKey}
      options={{
        theme: 'light',
        appearance: 'interaction-only',
      }}
      onSuccess={() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        onSuccess?.()
      }}
      onError={() => onError?.()}
      onExpire={() => onError?.()}
    />
  )
}
