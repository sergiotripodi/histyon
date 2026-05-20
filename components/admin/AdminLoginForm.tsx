'use client'

import { useTransition } from 'react'
import { adminLogin } from '@/lib/actions/admin-auth'
import { Loader2 } from 'lucide-react'

export function AdminLoginForm() {
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => { adminLogin(formData) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-white placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
          placeholder="Email"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-white placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors"
          placeholder="Password"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gray-900 text-white text-sm font-medium py-3 px-4 hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Accesso in corso…
          </>
        ) : (
          'Accedi'
        )}
      </button>
    </form>
  )
}
