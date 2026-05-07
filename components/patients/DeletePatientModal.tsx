'use client'

import { useState, useTransition } from 'react'
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react'
import { deletePatient } from '@/lib/actions/patient'

interface DeletePatientModalProps {
  patientId: string
  patientName: string
  fiscalCode: string
  ticketCount: number
  dict: any
}

export function DeletePatientModal({
  patientId, patientName, fiscalCode, ticketCount, dict
}: DeletePatientModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const t = dict.dashboard.patients.delete
  const confirmed = confirmText.toUpperCase() === fiscalCode.toUpperCase()

  const handleDelete = () => {
    if (!confirmed) return
    setError(null)
    startTransition(async () => {
      const res = await deletePatient(patientId)
      if (res?.error) setError(res.error)
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 border border-gray-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
      >
        <Trash2 className="w-4 h-4" />
        {t.btnDelete}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md shadow-xl border border-gray-200 animate-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 tracking-tight">{t.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{patientName}</p>
            </div>
          </div>
          <button
            onClick={() => { setIsOpen(false); setConfirmText('') }}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">{t.subtitle}</p>

          <div className="bg-red-50 border border-red-200 p-4 space-y-1.5">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">{t.warningLabel}</p>
            <p className="text-xs text-red-600 leading-relaxed">{t.warning}</p>
            {ticketCount > 0 && (
              <p className="text-xs font-bold text-red-700 mt-2">
                {ticketCount} {t.ticketCount}
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t.confirm} <span className="font-mono text-gray-900">{fiscalCode}</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={fiscalCode}
              className="flex h-11 w-full border border-gray-300 bg-white px-3 text-sm font-mono uppercase focus:outline-none focus:border-red-400 transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setIsOpen(false); setConfirmText('') }}
              className="flex-1 h-11 text-sm font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
            >
              {t.btnCancel}
            </button>
            <button
              onClick={handleDelete}
              disabled={!confirmed || isPending}
              className="flex-1 h-11 text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />{t.btnDeleting}</>
                : t.btnDelete
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
