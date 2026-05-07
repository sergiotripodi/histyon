'use client'

import { MONTHS, DAYS } from '@/lib/constants'
import { useEffect, useState } from 'react'

interface DateOfBirthPickerProps {
  date?: Date | undefined
  setDate?: (date: Date | undefined) => void
  name?: string
  defaultDate?: string | Date | null
  dict?: any
  labels?: { day: string, month: string, year: string }
}

export function DateOfBirthPicker({ 
  date, 
  setDate, 
  name = "dob", 
  defaultDate, 
  dict, 
  labels 
}: DateOfBirthPickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 110 }, (_, i) => currentYear - i);
  const texts = labels || dict?.auth?.form?.placeholders || { day: "Giorno", month: "Mese", year: "Anno" };

  const [day, setDay] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [year, setYear] = useState<string>('')

  const parseDate = (d: any) => {
    const dateObj = d instanceof Date ? d : d ? new Date(d) : null;
    if (dateObj && !isNaN(dateObj.getTime())) {
      return {
        d: dateObj.getDate().toString(),
        m: (dateObj.getMonth() + 1).toString(),
        y: dateObj.getFullYear().toString()
      };
    }
    return { d: '', m: '', y: '' };
  };

  useEffect(() => {
    const initial = parseDate(date || defaultDate);
    setDay(initial.d);
    setMonth(initial.m);
    setYear(initial.y);
  }, []);

  useEffect(() => {
    const updated = parseDate(defaultDate);
    setDay(updated.d);
    setMonth(updated.m);
    setYear(updated.y);
  }, [defaultDate]);

  useEffect(() => {
    if (date) {
      const updated = parseDate(date);
      setDay(updated.d);
      setMonth(updated.m);
      setYear(updated.y);
    }
  }, [date]);

  const handleChange = (newD: string, newM: string, newY: string) => {
    setDay(newD);
    setMonth(newM);
    setYear(newY);
    
    if (setDate) {
      if (newD && newM && newY) {
        const newDate = new Date(parseInt(newY), parseInt(newM) - 1, parseInt(newD));
        if (newDate.getDate() === parseInt(newD)) { 
          setDate(newDate);
        }
      } else {
        setDate(undefined);
      }
    }
  };

  const selectClass = "flex h-12 w-full rounded-none bg-white border border-gray-300 px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-gray-900 text-gray-900 transition-all duration-200";

  return (
    <div className="grid grid-cols-3 gap-2">
      <input type="hidden" name={`${name}_day`} value={day} />
      <input type="hidden" name={`${name}_month`} value={month} />
      <input type="hidden" name={`${name}_year`} value={year} />
      <input type="hidden" name={name} value={day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : ''} />

      <div className="relative">
        <select value={day} onChange={(e) => handleChange(e.target.value, month, year)} className={selectClass}>
            <option value="" disabled>{texts.day}</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="relative">
        <select value={month} onChange={(e) => handleChange(day, e.target.value, year)} className={selectClass}>
            <option value="" disabled>{texts.month}</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </div>

      <div className="relative">
        <select value={year} onChange={(e) => handleChange(day, month, e.target.value)} className={selectClass}>
            <option value="" disabled>{texts.year}</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}