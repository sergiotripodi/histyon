'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/FormElements'
import { CountryDialSelect } from './CountryDialSelect'

export function PhoneInput({ label, defaultValue }: { label: string, defaultValue?: string }) {
  const [prefix, setPrefix] = useState('+39')
  const [number, setNumber] = useState(defaultValue?.replace(/^\+\d+\s*/, '') || '')

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      <div className="flex gap-2">
        <div className="w-[140px] shrink-0">
          <CountryDialSelect value={prefix} onChange={setPrefix} />
        </div>
        <div className="flex-1">
          <Input
            type="tel"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="333 1234567"
          />
          <input type="hidden" name="phone" value={number ? `${prefix} ${number}` : ''} />
        </div>
      </div>
    </div>
  )
}
