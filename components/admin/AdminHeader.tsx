'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { LogOut } from 'lucide-react'
import { adminLogout } from '@/lib/actions/admin-auth'
import { useTransition } from 'react'

export function AdminHeader() {
  const [pending, startTransition] = useTransition()

  return (
    <header className="fixed top-0 left-0 right-0 h-11 bg-white border-b border-gray-200 flex items-center px-5 gap-4 z-40">
      <Link href="/ops-histyon-console/dashboard" className="hover:opacity-75 transition-opacity shrink-0">
        <Logo color="black" className="[&_img]:h-5" />
      </Link>
      <button
        onClick={() => startTransition(() => { adminLogout() })}
        disabled={pending}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        <LogOut className="w-3.5 h-3.5" />
        Esci
      </button>
    </header>
  )
}
