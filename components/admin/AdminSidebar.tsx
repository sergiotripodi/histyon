'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import {
  LayoutDashboard, Users, Activity, Server,
  Database, Shield, CreditCard, LogOut
} from 'lucide-react'
import { adminLogout } from '@/lib/actions/admin-auth'
import { useTransition } from 'react'

const navItems = [
  { href: '/ops-histyon-console/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/ops-histyon-console/dashboard/users',     icon: Users,           label: 'Utenti' },
  { href: '/ops-histyon-console/dashboard/analyses',  icon: Activity,        label: 'Analisi' },
  { href: '/ops-histyon-console/dashboard/vercel',    icon: Server,          label: 'Vercel' },
  { href: '/ops-histyon-console/dashboard/supabase',  icon: Database,        label: 'Supabase' },
  { href: '/ops-histyon-console/dashboard/cloudflare',icon: Shield,          label: 'Cloudflare' },
  { href: '/ops-histyon-console/dashboard/payments',  icon: CreditCard,      label: 'Pagamenti' },
]

function getActive(pathname: string): string {
  if (pathname === '/ops-histyon-console/dashboard') return '/ops-histyon-console/dashboard'
  const match = navItems.slice(1).find(n => pathname.startsWith(n.href))
  return match?.href ?? '/ops-histyon-console/dashboard'
}

export function AdminSidebar() {
  const pathname = usePathname()
  const active = getActive(pathname)
  const [pending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(() => { adminLogout() })
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-gray-200 flex flex-col z-40">

      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
        <Link href="/ops-histyon-console/dashboard" className="hover:opacity-75 transition-opacity flex items-center gap-3">
          <Logo color="black" className="[&_img]:h-6" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l border-gray-200 pl-3">
            Console
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = active === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium tracking-wide transition-all duration-150 ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t border-gray-200 p-3 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 border border-gray-900 bg-gray-900 text-white flex items-center justify-center shrink-0">
            <span className="text-xs font-bold">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">Amministratore</p>
            <p className="text-xs text-gray-400 font-medium truncate mt-0.5">Account speciale</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={pending}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Esci
        </button>
      </div>

    </aside>
  )
}
