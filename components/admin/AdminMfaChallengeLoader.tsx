'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { adminMfaGetChallenge } from '@/lib/actions/admin-auth'
import { AdminMfaChallengeForm } from '@/components/admin/AdminMfaChallengeForm'
import { Loader2 } from 'lucide-react'

export function AdminMfaChallengeLoader() {
  const router = useRouter()
  const [challengeData, setChallengeData] = useState<{
    factorId: string
    challengeId: string
  } | null>(null)
  const [pending, startTransition] = useTransition()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true
    startTransition(async () => {
      const result = await adminMfaGetChallenge()
      if (result.error || !result.factorId) {
        router.push('/tripo/login?error=default')
        return
      }
      setChallengeData({
        factorId: result.factorId!,
        challengeId: result.challengeId!,
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (pending || !challengeData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <AdminMfaChallengeForm
      factorId={challengeData.factorId}
      challengeId={challengeData.challengeId}
    />
  )
}
