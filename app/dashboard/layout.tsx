import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { MobileDesktopGate } from '@/components/layout/MobileDesktopGate'
import { IdleTimeout } from '@/components/auth/IdleTimeout'
import { getDictionary } from '@/lib/dictionary'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Console - Histyon',
    template: '%s - Histyon',
  },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profile, dict] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single().then(r => r.data),
    getDictionary(),
  ])

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <MobileDesktopGate />
      <IdleTimeout />
      <DashboardSidebar
        profile={profile}
        userEmail={user.email}
        userMetadata={user.user_metadata}
        dict={dict}
      />
      <main className="pl-[240px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
