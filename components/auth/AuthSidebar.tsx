'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

interface AuthSidebarProps {
  dict: any
}

export function AuthSidebar({ dict }: AuthSidebarProps) {
  const [index, setIndex] = useState(0)
  
  const t = dict?.auth?.sidebar || { testimonials: [], footer: '', secure: '' };
  const testimonials = t.testimonials || [];

  useEffect(() => {
    if (testimonials.length === 0) return;
    const timer = setInterval(() => setIndex((p) => (p + 1) % testimonials.length), 8000)
    return () => clearInterval(timer)
  }, [index, testimonials.length])

  return (
    <div className="hidden lg:flex w-[45%] bg-black text-white flex-col justify-between relative overflow-hidden py-6 pr-16 xl:pr-32" style={{ paddingLeft: 'calc((100vw - 80rem) / 2 + var(--app-px))' }}>      
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
      <Link href="/" className="relative z-10 block hover:opacity-80 transition-opacity">
        <Logo color="white" />
      </Link>

      <div className="relative z-10 h-48 flex flex-col justify-end">
        {testimonials.length > 0 && (
            <AnimatePresence mode='wait'>
            <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="space-y-4 mb-6">
                <blockquote className="text-xl md:text-2xl font-medium leading-relaxed">"{testimonials[index].text}"</blockquote>
                <div>
                    <p className="font-bold">{testimonials[index].author}</p>
                    <p className="text-sm text-gray-400">{testimonials[index].role}</p>
                </div>
            </motion.div>
            </AnimatePresence>
        )}
        
        {testimonials.length > 0 && (
            <div className="flex gap-2">
            {testimonials.map((_: any, i: number) => (
                <div key={i} onClick={() => setIndex(i)} className={`h-1 cursor-pointer transition-all duration-300 rounded-full ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
            ))}
            </div>
        )}
      </div>

      <div className="relative z-10 flex justify-between items-end text-xs text-gray-500 border-t border-white/10 pt-4 mt-4">
        <p>{t.footer}</p>
        <p>{t.secure}</p>
      </div>
    </div>
  )
}