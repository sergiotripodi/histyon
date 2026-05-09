'use client'

import { useRef, useState, useTransition } from 'react'
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react'
import { deleteAccount } from '@/lib/actions/settings'

interface DeleteAccountModalProps {
  dict: any
}

export function DeleteAccountModal({ dict }: DeleteAccountModalProps) {
  const d = dict.dashboard.settings.danger
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const res = await deleteAccount(formData)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <>
      {/* Trigger button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 max-w-xs">{d.deleteDesc}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-150 shrink-0 ml-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {d.deleteBtn}
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md border border-gray-200 shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">{d.modal.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null) }}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600 mb-3">{d.modal.warning}</p>
              <ul className="space-y-1.5 mb-5">
                {d.modal.items.map((item: string) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3 mb-6 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <p>{d.modal.irreversible}</p>
              </div>

              <form ref={formRef} action={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {d.modal.passwordLabel}
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full h-11 border border-gray-300 focus:border-red-400 focus:outline-none px-3 text-sm transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setError(null) }}
                    className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {d.modal.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2.5 border border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400 disabled:opacity-60 text-red-700 text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{d.modal.deleting}</>
                    ) : (
                      d.modal.confirmBtn
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
