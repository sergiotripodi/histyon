'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectItem, ValidatedInput } from '@/components/ui/FormElements'
import { COUNTRY_MAP, ITALIAN_PROVINCES } from '@/lib/constants'

interface LocationDefaults {
  country?: string
  addressStreet?: string
  addressCivic?: string
  postalCode?: string
  city?: string
  region?: string
}

function Flag({ code }: { code: string }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} shrink-0`}
      style={{ width: '1.25rem', height: '0.9rem', display: 'inline-block', lineHeight: 1 }}
    />
  )
}

function CountrySelect({
  value,
  onChange,
  label,
  name,
  defaultCountryCode = 'IT',
}: {
  value: string
  onChange: (name: string, code: string) => void
  label: string
  name: string
  defaultCountryCode?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const currentEntry = COUNTRY_MAP.find(c => c.name === value) ??
    COUNTRY_MAP.find(c => c.code === defaultCountryCode)!

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return COUNTRY_MAP
    return COUNTRY_MAP.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
        {label} *
      </label>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 h-12 px-3 bg-white border border-gray-300 hover:border-gray-500 focus:outline-none focus:border-gray-900 transition-colors duration-150 w-full text-sm"
      >
        <Flag code={currentEntry.code} />
        <span className="flex-1 text-left truncate">{currentEntry.name}</span>
        <ChevronDown
          className="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 shadow-lg w-full">
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
                onClick={() => { onChange(c.name, c.code); setOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  c.name === value ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                <Flag code={c.code} />
                <span className="text-xs font-bold text-gray-600 w-8 shrink-0">{c.code}</span>
                <span className="text-gray-700 truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function GlobalLocationSelector({ defaults, dict }: { defaults?: LocationDefaults, dict?: any }) {
  const [countryCode, setCountryCode] = useState(() => {
    if (defaults?.country) {
      const c = COUNTRY_MAP.find(x => x.name === defaults.country)
      if (c) return c.code
    }
    return 'IT'
  })
  const [countryName, setCountryName] = useState(defaults?.country || 'Italy')
  const [region, setRegion] = useState(defaults?.region || '')

  const t = dict?.auth?.form || {
    labels: { country: 'Paese', address: 'Indirizzo', civic: 'Civico', zip: 'CAP', city: 'Città', province: 'Provincia/Stato' },
    placeholders: {},
    warnings: { required: 'Obbligatorio' },
  }

  return (
    <div className="space-y-4">
      <CountrySelect
        label={t.labels.country}
        name="country"
        value={countryName}
        onChange={(name, code) => {
          setCountryName(name)
          setCountryCode(code)
          setRegion('')
        }}
      />

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <ValidatedInput name="addressStreet" defaultValue={defaults?.addressStreet} label={t.labels.address} required errorMessage={t.warnings.required} />
        </div>
        <div className="col-span-1">
          <ValidatedInput name="addressCivic" defaultValue={defaults?.addressCivic} label={t.labels.civic} required errorMessage={t.warnings.required} />
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-2">
          <ValidatedInput name="postalCode" defaultValue={defaults?.postalCode} label={t.labels.zip} required errorMessage={t.warnings.required} />
        </div>
        <div className="col-span-2">
          <ValidatedInput name="city" defaultValue={defaults?.city} label={t.labels.city} required errorMessage={t.warnings.required} />
        </div>
        <div className="col-span-2 relative">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t.labels.province} *</label>
          {countryCode === 'IT' ? (
            <Select name="region" value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-12">
                <span className="truncate">{region || 'Seleziona'}</span>
              </SelectTrigger>
              <SelectContent>
                {ITALIAN_PROVINCES.map((r, idx) => (
                  <SelectItem key={idx} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <ValidatedInput
              name="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
              errorMessage={t.warnings.required}
            />
          )}
        </div>
      </div>
    </div>
  )
}
