import { redirect } from 'next/navigation'

export default function AdminConsoleRoot() {
  redirect('/admin/login')
}
