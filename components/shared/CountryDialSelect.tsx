'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { COUNTRY_MAP } from '@/lib/constants'

interface CountryEntry {
  name: string
  code: string
  dial_code: string
}

interface CountryDialSelectProps {
  value: string
  onChange: (dialCode: string) => void
}

function Flag({ code }: { code: string }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} shrink-0`}
      style={{ width: '1.25rem', height: '0.9rem', display: 'inline-block', lineHeight: 1 }}
    />
  )
}

export function CountryDialSelect({ value, onChange }: CountryDialSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const current = COUNTRY_MAP.find(c => c.dial_code === value) ?? COUNTRY_MAP.find(c => c.code === 'IT')!

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return COUNTRY_MAP as CountryEntry[]
    return (COUNTRY_MAP as CountryEntry[]).filter(
      c => c.name.toLowerCase().includes(q) ||
           c.code.toLowerCase().includes(q) ||
           c.dial_code.includes(q)
    )
  }, [search])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-12 px-3 bg-white border border-gray-300 hover:border-gray-500 focus:outline-none focus:border-gray-900 transition-colors duration-150 w-full"
      >
        <Flag code={current.code} />
        <span className="text-xs font-bold text-gray-700 tracking-wide">{current.code}</span>
        <span className="text-sm text-gray-500">{current.dial_code}</span>
        <ChevronDown
          className="w-3.5 h-3.5 text-gray-400 ml-auto shrink-0 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 shadow-lg min-w-[220px]">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 border border-gray-200 bg-gray-50">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="text-sm bg-transparent outline-none w-full placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.dial_code); setOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  c.dial_code === value ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                <Flag code={c.code} />
                <span className="text-xs font-bold text-gray-600 w-8 shrink-0">{c.code}</span>
                <span className="text-gray-500 text-xs">{c.dial_code}</span>
                <span className="text-gray-400 text-xs truncate ml-1">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
