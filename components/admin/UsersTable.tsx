'use client'

import { useState } from 'react'

const INITIAL = 10
const STEP    = 15

export interface UserRow {
  id:            string
  email:         string | null
  first_name:    string | null
  last_name:     string | null
  hospital_name: string | null
  created_at:    string
  analyses:      number
  storageBytes:  number
  egressBytes:   number
}

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return b > 0 ? `${b} B` : '—'
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [visible, setVisible] = useState(INITIAL)

  const shown = users.slice(0, visible)
  const remaining = users.length - visible

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Nome', 'Analisi', 'Storage', 'Egress mese', 'Email', 'Ospedale', 'Registrato il'].map(h => (
              <th key={h} className="text-left px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map(u => (
            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-6 py-3 font-medium text-gray-900">
                {u.first_name && u.last_name ? `Dr. ${u.last_name}` : u.first_name ?? '—'}
              </td>
              <td className="px-6 py-3 text-xs font-mono text-gray-700">
                {u.analyses > 0 ? u.analyses.toLocaleString('it-IT') : '—'}
              </td>
              <td className="px-6 py-3 text-xs font-mono text-gray-500">
                {formatBytes(u.storageBytes)}
              </td>
              <td className="px-6 py-3 text-xs font-mono text-gray-500">
                {u.egressBytes > 0 ? formatBytes(u.egressBytes) : '—'}
              </td>
              <td className="px-6 py-3 text-gray-500">{u.email ?? '—'}</td>
              <td className="px-6 py-3 text-gray-400">{u.hospital_name ?? '—'}</td>
              <td className="px-6 py-3 text-gray-400 font-mono text-xs">
                {new Date(u.created_at).toLocaleDateString('it-IT')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {remaining > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
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
        <div className="px-6 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">{users.length} utenti totali</p>
        </div>
      )}
    </div>
  )
}
