'use client'

import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle2, ChevronDown, Check } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={`flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className}`}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

interface SelectContextType {
  value: string
  onChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = createContext<SelectContextType | undefined>(undefined)

export function Select({ children, value, onValueChange, defaultValue, name }: { children: React.ReactNode, value?: string, onValueChange?: (val: string) => void, defaultValue?: string, name?: string }) {
  const [internalValue, setInternalValue] = useState(defaultValue || "")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleValueChange = (val: string) => {
    setInternalValue(val)
    if (onValueChange) onValueChange(val)
    setOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
     if (value !== undefined) setInternalValue(value);
  }, [value]);

  const currentValue = value !== undefined ? value : internalValue

  return (
    <SelectContext.Provider value={{ value: currentValue, onChange: handleValueChange, open, setOpen }}>
      <div className="relative w-full" ref={containerRef}>
        {children}
        {name && <input type="hidden" name={name} value={currentValue} />}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ children, className }: { children: React.ReactNode, className?: string }) {
  const ctx = useContext(SelectContext)
  if (!ctx) throw new Error("SelectTrigger must be used within Select")
  return (
    <button type="button" onClick={() => ctx.setOpen(!ctx.open)} className={`flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-3 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200" style={{ transform: ctx.open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="pointer-events-none">{placeholder}</span>
}

export function SelectContent({ children, className }: { children: React.ReactNode, className?: string }) {
  const ctx = useContext(SelectContext)
  if (!ctx || !ctx.open) return null
  return (
    <div className={`absolute top-full left-0 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-lg animate-in fade-in-80 zoom-in-95 z-50 ${className}`}>
      <div className="p-1 max-h-[250px] overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  )
}

export function SelectItem({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const ctx = useContext(SelectContext)
  if (!ctx) throw new Error("SelectItem must be used within Select")
  const isSelected = ctx.value === value
  return (
    <div onClick={() => ctx.onChange(value)} className={`relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-2 pr-8 text-sm outline-none hover:bg-gray-50 focus:bg-gray-50 cursor-pointer ${className} ${isSelected ? 'bg-gray-50 font-medium' : ''}`}>
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">{isSelected && <Check className="h-4 w-4" />}</span>
      <span className="truncate w-full">{children}</span>
    </div>
  )
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  pattern?: string
  errorMessage?: string
  externalError?: string
}

export function ValidatedInput({ label, type, pattern, errorMessage, externalError, className, defaultValue, ...props }: ValidatedInputProps) {
  const [value, setValue] = useState(defaultValue || '')
  const [touched, setTouched] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isNotEmpty = String(value).trim().length > 0;
  
  let patternCheck = true;
  if (pattern && isNotEmpty) {
      try {
          let regexBody = pattern;
          let regexFlags = '';
          if (typeof pattern === 'string' && pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
              const lastSlashIndex = pattern.lastIndexOf('/');
              regexBody = pattern.slice(1, lastSlashIndex);
              regexFlags = pattern.slice(lastSlashIndex + 1);
          }
          const regex = new RegExp(regexBody, regexFlags);
          patternCheck = regex.test(String(value));
      } catch(e) {}
  }

  const activeExternalError = isTyping ? undefined : externalError;

  const isError = 
      !!activeExternalError || 
      (touched && hasInteracted && props.required && !isNotEmpty) || 
      (touched && hasInteracted && isNotEmpty && !patternCheck);

  const isSuccess = isNotEmpty && patternCheck && !activeExternalError;
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type
  
  const borderClass = isError 
    ? 'border-red-300 bg-red-50/40' 
    : isSuccess 
        ? 'border-emerald-300 bg-emerald-50/30' 
        : 'border-gray-300'

  const displayError = activeExternalError || (isError ? errorMessage : null)

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{label} {props.required && <span className="text-red-500">*</span>}</label>}
      <div className="relative group">
        <Input 
          {...props} 
          autoComplete={type === 'password' && !props.autoComplete ? 'new-password' : props.autoComplete}
          type={inputType} 
          value={value} 
          className={`pr-10 ${borderClass} transition-colors duration-300 ${className || ''}`} 
          onPointerDown={() => setHasInteracted(true)} 
          onKeyDown={() => setHasInteracted(true)}
          onBlur={(e) => { 
              setTouched(true)
              if (props.onBlur) props.onBlur(e) 
          }} 
          onChange={(e) => { 
            setValue(e.target.value); 
            setHasInteracted(true);
            setIsTyping(true); 
            if (props.onChange) props.onChange(e) 
          }} 
        />
        
        {type === 'password' && (
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        )}
        
        {type !== 'password' && isError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none animate-in zoom-in">
                <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
        )}
        {type !== 'password' && isSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none animate-in zoom-in">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
        )}
      </div>
      
      {displayError && (isError) && <p className="text-[11px] font-medium text-red-600 mt-1.5 ml-1 flex items-center gap-1 animate-in slide-in-from-top-1">• {displayError}</p>}
    </div>
  )
}