import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <DashboardSidebar
        profile={profile}
        userEmail={user.email}
        userMetadata={user.user_metadata}
      />
      <main className="pl-[240px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
