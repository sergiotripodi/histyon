import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/dictionary'

interface HeaderProps {
  variant?: 'public' | 'dashboard'
}

export async function Header({ variant = 'public' }: HeaderProps) {
  const supabase = await createClient()
  const dict = await getDictionary()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 w-full transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <Link href={user ? "/dashboard" : "/"} className="hover:opacity-80 transition-opacity flex items-center gap-2 md:gap-3">
            <div>
              <Logo color="black" className="[&_img]:h-5 md:[&_img]:h-7" />
            </div>
            {variant === 'dashboard' && (
                <span className="hidden sm:block text-[10px] text-gray-400 font-medium uppercase tracking-widest border-l border-gray-200 pl-3 pt-0.5">
                    Console
                </span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {user ? (
            <Link
              href="/dashboard"
              className="btn-elegant whitespace-nowrap text-xs md:text-sm md:px-5 md:py-2.5"
            >
              {dict.landing.header.toConsole}
            </Link>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <Link
                href="/auth/login"
                className="text-xs md:text-sm font-medium text-gray-600 hover:text-black transition-colors border-b border-transparent hover:border-gray-900"
              >
                {dict.auth.login.btn}
              </Link>
              <Link
                href="/auth/register"
                className="btn-elegant whitespace-nowrap text-xs md:text-sm md:px-5 md:py-2.5"
              >
                {dict.auth.login.requestAccess}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}