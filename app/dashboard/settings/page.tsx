import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect }          from 'next/navigation'
import { getDictionary }     from '@/lib/dictionary'
import { SettingsForm }      from '@/components/settings/SettingsForm'
import {
  ActivityLogsTabs,
  type SessionRow,
  type LogRow,
} from '@/components/settings/ActivityLogsTabs'

export const metadata = { title: 'Impostazioni' }
export const dynamic  = 'force-dynamic'

const ACCESS_ACTIONS   = ['login', 'logout', 'mfa_enrolled', 'mfa_verified']
const ACTIVITY_ACTIONS = [
  'profile_updated', 'email_change_requested', 'password_changed',
  'patient_created', 'patient_deleted',
  'ticket_created', 'ticket_deleted',
  'account_deleted',
]

const PAGE_SIZE = 10

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  const [
    { data: profile },
    { data: factors },
    sessionsResult,
    accessResult,
    activityResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.auth.mfa.listFactors(),
    // Sessions via SECURITY DEFINER function (auth schema not exposed via PostgREST)
    supabase.rpc('get_my_sessions').then(r => r, () => ({ data: null, error: null })),
    // Initial access logs — RLS allows doctor to read own rows
    admin
      .from('doctor_activity_logs')
      .select('id, action, success, ip_address, user_agent, created_at')
      .eq('doctor_id', user.id)
      .in('action', ACCESS_ACTIONS)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1),
    admin
      .from('doctor_activity_logs')
      .select('id, action, success, ip_address, user_agent, created_at')
      .eq('doctor_id', user.id)
      .in('action', ACTIVITY_ACTIONS)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1),
  ])

  const mfaFactor = (factors?.totp ?? []).find((f: { status: string }) => f.status === 'verified') ?? null
  const dict      = await getDictionary()

  // Derive pagination state
  const rawAccess   = (accessResult.data   ?? []) as LogRow[]
  const rawActivity = (activityResult.data ?? []) as LogRow[]
  const accessHasMore   = rawAccess.length   > PAGE_SIZE
  const activityHasMore = rawActivity.length > PAGE_SIZE
  const initialAccessLogs    = accessHasMore   ? rawAccess.slice(0, PAGE_SIZE)   : rawAccess
  const initialActivityLogs  = activityHasMore ? rawActivity.slice(0, PAGE_SIZE) : rawActivity

  const sessions = (sessionsResult.data ?? []) as SessionRow[]

  return (
    <div className="layout-container py-10">
      <div className="pb-8 mb-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{dict.dashboard.settings.title}</h1>
        <p className="text-sm text-gray-500 mt-1.5">{dict.dashboard.settings.subtitle}</p>
      </div>
      <SettingsForm user={user} profile={profile} dict={dict} mfaFactor={mfaFactor} />
      <ActivityLogsTabs
        sessions={sessions}
        initialAccessLogs={initialAccessLogs}
        initialActivityLogs={initialActivityLogs}
        accessHasMore={accessHasMore}
        activityHasMore={activityHasMore}
      />
    </div>
  )
}
