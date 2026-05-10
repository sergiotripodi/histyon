'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { mfaGetChallenge, mfaVerifyLogin } from '@/lib/actions/auth'
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

export function MfaChallengeForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    mfaGetChallenge().then((res) => {
      if (res.error) { setError(res.error); setLoading(false); return }
      setFactorId(res.factorId!)
      setChallengeId(res.challengeId!)
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    })
  }, [])

  const handleChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    setVerifying(true)
    setError('')
    const res = await mfaVerifyLogin(factorId, challengeId, code)
    if (res.error) {
      setError(res.error)
      setVerifying(false)
      setCode('')
      // Refresh challenge (expired after failed attempt)
      mfaGetChallenge().then(r => {
        if (!r.error) { setFactorId(r.factorId!); setChallengeId(r.challengeId!) }
      })
      return
    }
    router.push('/dashboard/home')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-0.5">
          Codice a 6 cifre
        </label>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={e => handleChange(e.target.value)}
          placeholder="000000"
          disabled={loading || verifying}
          className="w-full h-14 border border-gray-200 bg-white px-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-gray-900 transition-colors disabled:opacity-50 placeholder:text-gray-200 placeholder:tracking-widest"
        />
        <p className="text-xs text-gray-400 text-center">
          Il codice si aggiorna ogni 30 secondi
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={code.length !== 6 || loading || verifying}
        className="btn-elegant w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {verifying ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Verifica in corso...</>
        ) : (
          <><ShieldCheck className="w-4 h-4" /> Accedi alla Console</>
        )}
      </button>
    </form>
  )
}
