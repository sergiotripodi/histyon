'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Clock } from 'lucide-react'

const IDLE_MS = 30 * 60 * 1000   // 30 min before sign-out
const WARN_MS = 28 * 60 * 1000   // warn at 28 min (2 min notice)

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const

export function IdleTimeout() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

  const resetTimers = useCallback(() => {
    setShowWarning(false)

    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (warnTimer.current) clearTimeout(warnTimer.current)

    warnTimer.current = setTimeout(() => setShowWarning(true), WARN_MS)
    idleTimer.current = setTimeout(() => signOut(), IDLE_MS)
  }, [signOut])

  useEffect(() => {
    resetTimers()

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }))

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (warnTimer.current) clearTimeout(warnTimer.current)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimers))
    }
  }, [resetTimers])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 w-full max-w-sm p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-50 border border-yellow-200">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Sessione in scadenza</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          La sessione verrà chiusa automaticamente per inattività tra <strong>2 minuti</strong>.
          Clicca per rimanere connesso.
        </p>
        <div className="flex gap-3">
          <button
            onClick={resetTimers}
            className="btn-elegant flex-1 py-2.5"
          >
            Rimani connesso
          </button>
          <button
            onClick={signOut}
            className="btn-elegant-soft py-2.5 px-4 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </div>
    </div>
  )
}
