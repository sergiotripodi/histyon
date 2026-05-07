import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/dictionary'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const dict = await getDictionary()

  return (
    <div className="layout-container py-10">
      <div className="pb-8 mb-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{dict.dashboard.settings.title}</h1>
        <p className="text-sm text-gray-500 mt-1.5">{dict.dashboard.settings.subtitle}</p>
      </div>
      <SettingsForm user={user} profile={profile} dict={dict} />
    </div>
  )
}
