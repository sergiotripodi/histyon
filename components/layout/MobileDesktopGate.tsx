'use client'

import Link from 'next/link'
import { Monitor, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export function MobileDesktopGate() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col md:hidden">

      {/* Top bar */}
      <div className="h-16 bg-black flex items-center px-6 shrink-0">
        <Logo color="white" className="[&_img]:h-8" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12">
        <div className="max-w-[280px]">

          {/* Icon */}
          <div className="w-11 h-11 border border-gray-200 flex items-center justify-center mb-10">
            <Monitor className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
          </div>

          {/* Eyebrow */}
          <p className="text-[10px] font-mono font-medium text-gray-400 uppercase tracking-[0.18em] mb-5">
            Console · Accesso riservato
          </p>

          {/* Headline */}
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-[1.15] mb-5">
            Apri da un<br />computer.
          </h1>

          {/* Body */}
          <p className="text-sm text-gray-500 leading-relaxed mb-10">
            La console Histyon è progettata per schermi desktop. Per analizzare i vetrini e gestire i pazienti, accedi da un browser su Mac o Windows.
          </p>

          {/* Divider */}
          <div className="h-px bg-gray-100 mb-8" />

          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors duration-150"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Torna alla home
          </Link>

        </div>
      </div>

      {/* Footer mark */}
      <div className="px-8 py-6 shrink-0">
        <p className="text-[10px] text-gray-300 tracking-wide font-mono">
          © 2026 Histyon · AI Medical Assistant
        </p>
      </div>

    </div>
  )
}
