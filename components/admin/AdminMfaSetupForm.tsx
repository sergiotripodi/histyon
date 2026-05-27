'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adminMfaVerifyEnrollment } from '@/lib/actions/admin-auth'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface Props {
  factorId: string
  qrCode: string
  secret: string
}

export function AdminMfaSetupForm({ factorId, qrCode, secret }: Props) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await adminMfaVerifyEnrollment(factorId, code)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/tripo/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* QR code — Supabase returns data:image/svg+xml;utf-8,... with trailing whitespace */}
      <div className="flex justify-center border border-gray-100 p-4 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCode.trim()} alt="QR Code 2FA" width={160} height={160} />
      </div>

      {/* Manual secret */}
      <div>
        <button
          type="button"
          onClick={() => setShowSecret(!showSecret)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showSecret ? 'Nascondi codice manuale' : 'Mostra codice manuale'}
        </button>
        {showSecret && (
          <p className="mt-2 font-mono text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-2 break-all">
            {secret}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
            Codice di verifica
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            required
            className="w-full border border-gray-200 px-4 py-3 text-sm text-center tracking-[0.4em] font-mono bg-white focus:outline-none focus:border-gray-900 transition-colors"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full bg-gray-900 text-white text-sm font-medium py-3 hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifica…</> : 'Conferma e accedi'}
        </button>
      </form>
    </div>
  )
}
