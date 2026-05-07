'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Users, Activity, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DashboardSidebarProps {
  profile?: any
  userEmail?: string
  userMetadata?: any
}

const navItems = [
  { href: '/dashboard', icon: Users, label: 'Pazienti' },
  { href: '/dashboard/analysis', icon: Activity, label: 'Analisi' },
  { href: '/dashboard/settings', icon: Settings, label: 'Impostazioni' },
]

function getActiveNav(pathname: string): string {
  if (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/patient')
  ) return '/dashboard'
  if (
    pathname.startsWith('/dashboard/analysis') ||
    pathname.startsWith('/dashboard/ticket') ||
    pathname.startsWith('/dashboard/viewer')
  ) return '/dashboard/analysis'
  if (pathname.startsWith('/dashboard/settings')) return '/dashboard/settings'
  return '/dashboard'
}

export function DashboardSidebar({ profile, userEmail, userMetadata }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const activeNav = getActiveNav(pathname)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const lastName = profile?.last_name || userMetadata?.last_name
  const firstName = profile?.first_name || userMetadata?.first_name
  const displayName = lastName ? `Dr. ${lastName}` : userEmail?.split('@')[0] || ''
  const initial = (firstName?.[0] || userEmail?.[0] || '').toUpperCase()

  return (
    <aside className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-gray-100 flex flex-col z-40">

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 shrink-0">
        <Link href="/dashboard" className="hover:opacity-75 transition-opacity">
          <Logo color="black" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = activeNav === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
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
      <div className="shrink-0 border-t border-gray-100 p-3 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0">
            <span className="text-xs font-bold">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{displayName}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">Medico</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 font-medium"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Esci
        </button>
      </div>

    </aside>
  )
}
