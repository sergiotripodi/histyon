'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { adminMfaEnroll } from '@/lib/actions/admin-auth'
import { AdminMfaSetupForm } from '@/components/admin/AdminMfaSetupForm'
import { Loader2 } from 'lucide-react'

export function AdminMfaSetupLoader() {
  const router = useRouter()
  const [enrollData, setEnrollData] = useState<{
    factorId: string
    qrCode: string
    secret: string
  } | null>(null)
  const [pending, startTransition] = useTransition()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true
    startTransition(async () => {
      const result = await adminMfaEnroll()
      if (result.alreadyEnrolled) {
        router.push('/ops-histyon-console/mfa-challenge')
        return
      }
      if (result.error || !result.factorId) {
        router.push('/ops-histyon-console/login?error=default')
        return
      }
      setEnrollData({
        factorId: result.factorId!,
        qrCode: result.qrCode!,
        secret: result.secret!,
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (pending || !enrollData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <AdminMfaSetupForm
      factorId={enrollData.factorId}
      qrCode={enrollData.qrCode}
      secret={enrollData.secret}
    />
  )
}
