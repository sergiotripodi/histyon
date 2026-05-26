'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const INITIAL = 10
const STEP    = 15

export interface UserRow {
  id:                    string
  email:                 string | null
  first_name:            string | null
  last_name:             string | null
  hospital_name:         string | null
  created_at:            string
  analyses:              number
  storageBytes:          number
  egressBytes:           number
  status:                string
  deletion_scheduled_at: string | null
}

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return b > 0 ? `${b} B` : '—'
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved:  'bg-green-50 text-green-700 border-green-200',
    pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    rejected:  'bg-red-50 text-red-600 border-red-200',
    suspended: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  const labels: Record<string, string> = {
    approved: 'Approvato', pending: 'In attesa', rejected: 'Rifiutato', suspended: 'Disattivato',
  }
  const cls = map[status] ?? 'bg-gray-50 text-gray-500 border-gray-200'
  return (
    <span className={`inline-block text-[10px] font-semibold uppercase tracking-[0.1em] border px-2 py-0.5 ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ── Reason modal ──────────────────────────────────────────────────────────────

interface ReasonModalProps {
  title:       string
  placeholder: string
  onConfirm:   (reason: string) => void
  onCancel:    () => void
  loading:     boolean
}

function ReasonModal({ title, placeholder, onConfirm, onCancel, loading }: ReasonModalProps) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 p-8 shadow-xl">
        <h2 className="text-base font-bold text-gray-900 mb-4">{title}</h2>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full border border-gray-200 text-sm px-3 py-2.5 resize-none focus:outline-none focus:border-gray-400 text-gray-800 placeholder-gray-300 mb-5"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 px-4 py-2 border border-gray-200 hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="text-xs font-medium bg-gray-900 text-white px-4 py-2 hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {loading ? 'Salvataggio…' : 'Conferma'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Row action buttons ────────────────────────────────────────────────────────

function RowActions({ user }: { user: UserRow }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal] = useState<'reject' | 'suspend' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function callAction(endpoint: string, body?: Record<string, string>) {
    setActionError(null)
    const res = await fetch(`/api/admin/users/${user.id}/${endpoint}`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body:    body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Errore sconosciuto' }))
      setActionError(data?.error ?? 'Errore sconosciuto')
      return
    }
    startTransition(() => router.refresh())
  }

  if (user.status === 'rejected') {
    const deletionDate = user.deletion_scheduled_at
      ? new Date(user.deletion_scheduled_at).toLocaleDateString('it-IT')
      : '—'
    return (
      <span className="text-[10px] text-gray-400 whitespace-nowrap">
        Eliminazione il {deletionDate}
      </span>
    )
  }

  return (
    <>
      {modal && (
        <ReasonModal
          title={modal === 'reject' ? 'Motivo del rifiuto' : 'Motivo della disattivazione'}
          placeholder={modal === 'reject'
            ? 'Es. Credenziali mediche non verificabili…'
            : 'Es. Violazione termini di servizio…'}
          loading={isPending}
          onCancel={() => setModal(null)}
          onConfirm={reason => {
            setModal(null)
            callAction(modal, { reason })
          }}
        />
      )}

      {actionError && (
        <p className="text-[10px] text-red-500 mb-1.5">{actionError}</p>
      )}

      <div className="flex gap-2 items-center">
        {user.status === 'pending' && (
          <>
            <button
              onClick={() => callAction('approve')}
              disabled={isPending}
              className="text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Approva
            </button>
            <button
              onClick={() => setModal('reject')}
              disabled={isPending}
              className="text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              Rifiuta
            </button>
          </>
        )}
        {user.status === 'approved' && (
          <button
            onClick={() => setModal('suspend')}
            disabled={isPending}
            className="text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            Disattiva
          </button>
        )}
        {user.status === 'suspended' && (
          <button
            onClick={() => callAction('reactivate')}
            disabled={isPending}
            className="text-[10px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            Riattiva
          </button>
        )}
      </div>
    </>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────

export function UsersTable({ users }: { users: UserRow[] }) {
  const [visible, setVisible] = useState(INITIAL)

  const shown     = users.slice(0, visible)
  const remaining = users.length - visible

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Nome', 'Stato', 'Analisi', 'Storage', 'Egress mese', 'Email', 'Ospedale', 'Registrato il', 'Azioni'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map(u => (
            <tr
              key={u.id}
              className={`border-b border-gray-50 transition-colors ${
                u.status === 'rejected' ? 'opacity-50' : 'hover:bg-gray-50'
              }`}
            >
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                {u.first_name && u.last_name ? `Dr. ${u.last_name}` : u.first_name ?? '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={u.status} />
              </td>
              <td className="px-4 py-3 text-xs font-mono text-gray-700">
                {u.analyses > 0 ? u.analyses.toLocaleString('it-IT') : '—'}
              </td>
              <td className="px-4 py-3 text-xs font-mono text-gray-500">
                {formatBytes(u.storageBytes)}
              </td>
              <td className="px-4 py-3 text-xs font-mono text-gray-500">
                {u.egressBytes > 0 ? formatBytes(u.egressBytes) : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500">{u.email ?? '—'}</td>
              <td className="px-4 py-3 text-gray-400">{u.hospital_name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                {new Date(u.created_at).toLocaleDateString('it-IT')}
              </td>
              <td className="px-4 py-3">
                <RowActions user={u} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {remaining > 0 && (
        <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            {shown.length} di {users.length} utenti
          </p>
          <button
            onClick={() => setVisible(v => v + STEP)}
            className="text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-1.5 transition-colors"
          >
            Mostra altri {Math.min(STEP, remaining)} →
          </button>
        </div>
      )}

      {remaining <= 0 && users.length > INITIAL && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">{users.length} utenti totali</p>
        </div>
      )}
    </div>
  )
}
