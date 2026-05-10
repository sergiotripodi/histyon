'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { mfaEnroll, mfaVerifyEnrollment } from '@/lib/actions/auth'
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

export function MfaSetupForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    mfaEnroll().then((res) => {
      if (res.alreadyEnrolled) { router.replace('/auth/mfa-challenge'); return }
      if (res.error) { setError(res.error); setLoading(false); return }
      setFactorId(res.factorId!)
      setQrCode(res.qrCode!)
      setSecret(res.secret!)
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    })
  }, [router])

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
    const res = await mfaVerifyEnrollment(factorId, code)
    if (res.error) { setError(res.error); setVerifying(false); setCode(''); return }
    router.push('/dashboard/home')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* QR code */}
      <div className="flex flex-col items-center justify-center py-6 border border-gray-100 bg-gray-50">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <p className="text-xs text-gray-400">Generazione codice QR...</p>
          </div>
        ) : qrCode ? (
          <img
            src={qrCode}
            alt="QR Code"
            className="w-56 h-56 object-contain bg-white p-3"
          />
        ) : null}
      </div>

      {/* Manual code toggle */}
      {secret && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowSecret(s => !s)}
            className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
          >
            {showSecret ? 'Nascondi codice manuale' : 'Non riesci a scansionare? Inserisci il codice manualmente'}
          </button>
          {showSecret && (
            <div className="mt-3 px-4 py-3 bg-gray-50 border border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Codice di configurazione</p>
              <p className="font-mono text-sm text-gray-800 tracking-widest break-all select-all">{secret}</p>
            </div>
          )}
        </div>
      )}

      {/* OTP input */}
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
          <><ShieldCheck className="w-4 h-4" /> Attiva verifica in due passaggi</>
        )}
      </button>
    </form>
  )
}
