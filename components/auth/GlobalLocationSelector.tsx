'use client'

import React, { useState } from 'react'
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

export function GlobalLocationSelector({ defaults, dict }: { defaults?: LocationDefaults, dict?: any }) {
  const [countryCode, setCountryCode] = useState(() => {
      if (defaults?.country) {
          const c = COUNTRY_MAP.find(x => x.name === defaults.country);
          if (c) return c.code;
      }
      return 'IT';
  });
  
  const [region, setRegion] = useState(defaults?.region || "");

  const t = dict?.auth?.form || { labels: { country: "Paese", address: "Indirizzo", civic: "Civico", zip: "CAP", city: "Città", province: "Provincia/Stato" }, placeholders: {}, warnings: { required: "Obbligatorio" } };

  return (
    <div className="space-y-4">
        <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t.labels.country} *</label>
            <Select 
                name="country" 
                defaultValue={defaults?.country || "Italy"}
                onValueChange={(val) => {
                    const country = COUNTRY_MAP.find(c => c.name === val)
                    if (country) setCountryCode(country.code)
                    setRegion("") 
                }}
            >
                <SelectTrigger className="h-12">
                   <span className="truncate">{COUNTRY_MAP.find(c => c.code === countryCode)?.name || "Seleziona"}</span>
                </SelectTrigger>
                <SelectContent>
                    {COUNTRY_MAP.map(c => (
                        <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        
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
                    <Select 
                        name="region" 
                        value={region} 
                        onValueChange={setRegion}
                    >
                        <SelectTrigger className="h-12">
                             <span className="truncate">{region || "Seleziona"}</span>
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