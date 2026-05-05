import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import ViewerWrapper from '@/components/viewer/ViewerWrapper'
import { isSafeDziSource } from '@/lib/url-security'

export default async function ViewerPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, patients(*)')
    .eq('id', id)
    .eq('doctor_id', user.id)
    .single()

  if (!ticket || (!ticket.public_url_dzi && !ticket.output_dzi_url)) return notFound()

  const dziUrl = String(ticket.public_url_dzi || ticket.output_dzi_url)
  if (!isSafeDziSource(dziUrl)) return notFound()

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      <Header />
      <main className="flex-1 relative bg-black">
        <ViewerWrapper dziUrl={dziUrl} />
      </main>
    </div>
  )
}