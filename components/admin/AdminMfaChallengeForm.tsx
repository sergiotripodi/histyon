'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adminMfaVerifyLogin } from '@/lib/actions/admin-auth'
import { Loader2, AlertCircle } from 'lucide-react'

interface Props { factorId: string; challengeId: string }

export function AdminMfaChallengeForm({ factorId, challengeId }: Props) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await adminMfaVerifyLogin(factorId, challengeId, code)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/ops-histyon-console/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
          Codice 2FA
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          required
          autoFocus
          className="w-full border border-gray-200 px-4 py-3 text-sm text-center tracking-[0.4em] font-mono bg-white focus:outline-none focus:border-gray-900 transition-colors"
          placeholder="000000"
        />
      </div>

      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="w-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifica…</> : 'Accedi alla console'}
      </button>
    </form>
  )
}
