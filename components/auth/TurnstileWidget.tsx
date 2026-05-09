'use client'

import { useEffect, useRef, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { AlertTriangle } from 'lucide-react'

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess?: () => void
  onError?: () => void
}

export function TurnstileWidget({ siteKey, onSuccess, onError }: TurnstileWidgetProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // Defer mount until browser is idle so the Cloudflare script doesn't block typing
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
    // Safety timeout: if Cloudflare doesn't respond in 15s, show error (don't silently enable submit)
    timerRef.current = setTimeout(() => {
      setFailed(true)
      onError?.()
    }, 15_000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [ready, onError])

  if (!ready) return null

  return (
    <div>
      {failed && (
        <p className="text-xs text-red-500 flex items-center gap-1.5 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Verifica di sicurezza non riuscita. Ricarica la pagina e riprova.
        </p>
      )}
      <Turnstile
        siteKey={siteKey}
        options={{ theme: 'light', appearance: 'interaction-only' }}
        onSuccess={() => {
          if (timerRef.current) clearTimeout(timerRef.current)
          onSuccess?.()
        }}
        onError={() => {
          setFailed(true)
          onError?.()
        }}
        onExpire={() => {
          setFailed(true)
          onError?.()
        }}
      />
    </div>
  )
}
