'use client'

import { MONTHS, DAYS } from '@/lib/constants'
import { useEffect, useState } from 'react'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/FormElements'

interface DateOfBirthPickerProps {
  date?: Date | undefined
  setDate?: (date: Date | undefined) => void
  name?: string
  defaultDate?: string | Date | null
  dict?: any
  labels?: { day: string; month: string; year: string }
}

function parseDate(d: unknown): { d: string; m: string; y: string } {
  const obj = d instanceof Date ? d : d ? new Date(d as string) : null
  if (obj && !isNaN(obj.getTime())) {
    return {
      d: obj.getDate().toString(),
      m: (obj.getMonth() + 1).toString(),
      y: obj.getFullYear().toString(),
    }
  }
  return { d: '', m: '', y: '' }
}

export function DateOfBirthPicker({
  date,
  setDate,
  name = 'dob',
  defaultDate,
  dict,
  labels,
}: DateOfBirthPickerProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 110 }, (_, i) => currentYear - i)
  const texts = labels || dict?.auth?.form?.placeholders || { day: 'Giorno', month: 'Mese', year: 'Anno' }

  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    const p = parseDate(date || defaultDate)
    setDay(p.d); setMonth(p.m); setYear(p.y)
  }, [])

  useEffect(() => {
    const p = parseDate(defaultDate)
    setDay(p.d); setMonth(p.m); setYear(p.y)
  }, [defaultDate])

  useEffect(() => {
    if (date) {
      const p = parseDate(date)
      setDay(p.d); setMonth(p.m); setYear(p.y)
    }
  }, [date])

  const handleChange = (newD: string, newM: string, newY: string) => {
    setDay(newD); setMonth(newM); setYear(newY)
    if (setDate) {
      if (newD && newM && newY) {
        const d = new Date(parseInt(newY), parseInt(newM) - 1, parseInt(newD))
        if (d.getDate() === parseInt(newD)) setDate(d)
      } else {
        setDate(undefined)
      }
    }
  }

  const fullDate = day && month && year
    ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    : ''

  const triggerClass = 'h-12 w-full text-sm'
  const placeholderClass = 'text-gray-400'

  return (
    <div className="grid grid-cols-3 gap-2">
      <input type="hidden" name={`${name}_day`}   value={day} />
      <input type="hidden" name={`${name}_month`} value={month} />
      <input type="hidden" name={`${name}_year`}  value={year} />
      <input type="hidden" name={name}             value={fullDate} />

      {/* Day */}
      <Select value={day} onValueChange={(v) => handleChange(v, month, year)}>
        <SelectTrigger className={triggerClass}>
          <span className={day ? 'text-gray-900' : placeholderClass}>
            {day || texts.day}
          </span>
        </SelectTrigger>
        <SelectContent>
          {DAYS.map((d) => (
            <SelectItem key={d} value={String(d)}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select value={month} onValueChange={(v) => handleChange(day, v, year)}>
        <SelectTrigger className={triggerClass}>
          <span className={month ? 'text-gray-900' : placeholderClass}>
            {month ? MONTHS[parseInt(month) - 1] : texts.month}
          </span>
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year */}
      <Select value={year} onValueChange={(v) => handleChange(day, month, v)}>
        <SelectTrigger className={triggerClass}>
          <span className={year ? 'text-gray-900' : placeholderClass}>
            {year || texts.year}
          </span>
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
