'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { Users, Activity, Settings, LogOut, Mail, LayoutDashboard, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DashboardSidebarProps {
  profile?: any
  userEmail?: string
  userMetadata?: any
  dict: any
}

function getActiveNav(pathname: string): string {
  if (pathname === '/dashboard/home') return '/dashboard/home'
  if (pathname.startsWith('/dashboard/patients') || pathname.startsWith('/dashboard/patient/')) return '/dashboard/patients'
  if (
    pathname.startsWith('/dashboard/analysis') ||
    pathname.startsWith('/dashboard/ticket') ||
    pathname.startsWith('/dashboard/viewer')
  ) return '/dashboard/analysis'
  if (pathname.startsWith('/dashboard/settings')) return '/dashboard/settings'
  return '/dashboard/home'
}

export function DashboardSidebar({ profile, userEmail, userMetadata, dict }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const activeNav = getActiveNav(pathname)
  const td = dict.dashboard

  const navItems = [
    { href: '/dashboard/home',     icon: LayoutDashboard, label: 'Home'            },
    { href: '/dashboard/patients',  icon: Users,           label: td.tabs.patients  },
    { href: '/dashboard/analysis', icon: Activity,        label: td.tabs.analysis  },
  ]

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
    <aside className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-gray-200 flex flex-col z-40">

      {/* Logo + Console label */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
        <Link href="/dashboard" className="hover:opacity-75 transition-opacity flex items-center gap-3">
          <Logo color="black" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l border-gray-200 pl-3">
            Console
          </span>
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
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium tracking-wide transition-all duration-150 ${
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

      {/* Bottom nav: Settings + Assistenza */}
      <div className="shrink-0 border-t border-gray-200 px-3 py-2 space-y-0.5">
        {([
          { href: '/dashboard/settings', icon: Settings, label: td.tabs.settings },
          { href: '/documentation', icon: BookOpen, label: 'Documentazione' },
        ] as const).map(({ href, icon: Icon, label }) => {
          const active = activeNav === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium tracking-wide transition-all duration-150 ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
        <a
          href="mailto:info@histyon.com"
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium tracking-wide text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150"
        >
          <Mail className="w-4 h-4 shrink-0" />
          {td.header.assistance}
        </a>
      </div>

      {/* User section */}
      <div className="shrink-0 border-t border-gray-200 p-3 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 border border-gray-900 bg-white text-gray-900 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{displayName}</p>
            <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{td.header.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {td.header.logout}
        </button>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-3 pt-2 pb-1">
          {[
            { href: '/legal/privacy', label: 'Privacy' },
            { href: '/legal/terms',   label: 'Termini' },
            { href: '/legal/cookie',  label: 'Cookie' },
            { href: '/legal/dpa',     label: 'DPA' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

    </aside>
  )
}
