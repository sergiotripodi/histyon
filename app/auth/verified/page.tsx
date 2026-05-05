import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
       <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Email Confirmed!</h1>
          <p className="text-gray-500 mb-6">Your account has been activated.</p>
          <Link href="/auth/login" className="block w-full bg-black text-white py-3 rounded-xl font-bold">
             Login Now
          </Link>
       </div>
    </div>
  )
}