'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react'
import { Dictionary } from '@/lib/dictionary'

interface UserDropdownProps {
  user: any
  profile?: any
  dict: Dictionary
}

export function UserDropdown({ user, profile, dict }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = profile?.last_name 
    ? `Dr. ${profile.last_name}` 
    : user.user_metadata?.last_name 
      ? `Dr. ${user.user_metadata.last_name}`
      : user.email?.split('@')[0]

  const initial = profile?.first_name?.[0] || user.email?.[0]?.toUpperCase()

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200 group"
      >
        <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-md ring-2 ring-transparent group-hover:ring-gray-200 transition-all">
          <span className="font-bold text-sm">{initial}</span>
        </div>
        
        <div className="hidden md:flex flex-col items-start text-xs">
          <span className="font-bold text-gray-900">{displayName}</span>
          <span className="text-gray-500 font-medium">Medico</span>
        </div>
        
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            
            <div className="px-3 py-3 border-b border-gray-50 mb-1">
              <p className="font-bold text-sm text-gray-900 truncate">{user.email}</p>
              {profile?.hospital && (
                 <p className="text-xs text-gray-500 mt-0.5 truncate">{profile.hospital}</p>
              )}
            </div>
            
            <div className="space-y-0.5">
              <Link 
                href="/dashboard" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
              >
                <LayoutDashboard className="w-4 h-4 text-gray-500" />
                Console
              </Link>

              <Link 
                href="/dashboard/settings" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                {dict.dashboard.settings.title}
              </Link>
            </div>

            <div className="border-t border-gray-50 mt-1 pt-1">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                {dict.dashboard.header.logout}
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  )
}