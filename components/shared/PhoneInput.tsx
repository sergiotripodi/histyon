'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/FormElements'
import { COUNTRY_MAP } from '@/lib/constants'

export function PhoneInput({ label, defaultValue }: { label: string, defaultValue?: string }) {
    const [prefix, setPrefix] = useState('+39')
    const [number, setNumber] = useState(defaultValue?.replace(/^\+\d+\s*/, '') || '')

    const currentCountry = COUNTRY_MAP.find(c => c.dial_code === prefix) || COUNTRY_MAP.find(c => c.code === 'IT');

    return (
        <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
            <div className="flex gap-2">
                <div className="w-[100px] relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-xl">
                        {currentCountry?.flag}
                    </span>
                    <select 
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        className="w-full h-12 pl-10 pr-2 bg-white border border-gray-200 rounded-xl text-sm font-bold appearance-none focus:ring-2 focus:ring-black focus:ring-inset outline-none cursor-pointer"
                    >
                        {COUNTRY_MAP.map((c) => (
                            <option key={c.code} value={c.dial_code}>{c.dial_code} ({c.code})</option>
                        ))}
                    </select>
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