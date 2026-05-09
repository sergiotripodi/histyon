'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, opts: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess?: () => void
  onError?: () => void
}

export function TurnstileWidget({ siteKey, onSuccess, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        size: 'normal',
        callback: onSuccess,
        'error-callback': onError,
        'expired-callback': onError,
      })
    }

    if (window.turnstile) {
      renderWidget()
      return
    }

    window.onloadTurnstileCallback = renderWidget

    const existing = document.getElementById('turnstile-script')
    if (!existing) {
      const script = document.createElement('script')
      script.id = 'turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, onSuccess, onError])

  return <div ref={containerRef} className="mt-1" />
}
