import Link from 'next/link'
import { AuthSidebar } from '@/components/auth/AuthSidebar'
import { RegisterForm } from '@/components/auth/RegisterForm' 
import { LogIn, ArrowRight } from 'lucide-react'
import { getDictionary } from '@/lib/dictionary'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary()
  return {
    title: dict.auth.register.title,
  }
}

export default async function RegisterPage() {
  const dict = await getDictionary();
  const t = dict.auth.register;
  
  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      
      <AuthSidebar dict={dict} />

      <div 
        className="flex-1 flex flex-col items-center h-screen overflow-hidden"
        style={{ padding: '1.5rem var(--app-px)' }} 
      >        
        <div className="w-full max-w-xl flex flex-col h-full py-6">
            
            <div className="mb-5">
               <h1 className="text-3xl font-bold mb-1">{t.heading}</h1>
               <p className="text-gray-500">{t.subheading}</p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                 <RegisterForm dict={dict} />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
                <Link href="/auth/login" className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-black hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                            <LogIn className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 text-sm">{t.alreadyAccount}</p>
                            <p className="text-xs text-gray-500">{t.accessConsole}</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                </Link>
            </div>
        </div>
      </div>
    </div>
  )
}