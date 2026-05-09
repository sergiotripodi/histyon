'use client'

import { useEffect, useRef, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess?: () => void
  onError?: () => void
}

export function TurnstileWidget({ siteKey, onSuccess, onError }: TurnstileWidgetProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Defer mounting until browser idle to avoid blocking user interaction on page load
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => setReady(true), { timeout: 2000 })
      return () => (window as any).cancelIdleCallback(id)
    } else {
      const id = setTimeout(() => setReady(true), 600)
      return () => clearTimeout(id)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    timerRef.current = setTimeout(() => onSuccess?.(), 15_000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [ready, onSuccess])

  if (!ready) return null

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
