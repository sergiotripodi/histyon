import { redirect } from 'next/navigation'

export const metadata = { title: 'Console' }

export default function DashboardRootPage() {
  redirect('/dashboard/home')
}
