import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { getDictionary, getLocale } from '@/lib/dictionary'

export async function Footer() {
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()])
  const t = dict.landing.footer
  const tl = dict.legal.tabs
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-gray-100 bg-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-12">
        
        <div className="flex flex-col gap-8 max-w-sm">
          <div className="opacity-90">
             <Logo color="black" className="[&_img]:h-6" />
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-light">
              &copy; {currentYear} Histyon Inc. {t.rights}
            </p>
            
            <div className="text-xs text-gray-400 font-light border-t border-gray-100 pt-4 mt-2">
              <span className="block uppercase tracking-wider mb-1 text-[10px] font-semibold text-gray-300">{t.credits}</span>
              {t.dev} <br/>
              <a href="mailto:paratoilario@icloud.com" className="hover:text-gray-900 transition-colors underline decoration-gray-200 underline-offset-2 hover:decoration-gray-900">Ilario Parato</a>, <a href="mailto:muschioleo07@gmail.com" className="hover:text-gray-900 transition-colors underline decoration-gray-200 underline-offset-2 hover:decoration-gray-900">Leonardo Muschietti</a>.
            </div>
          </div>
        </div>

        <nav className="flex flex-col md:flex-row gap-8 md:gap-16 text-sm text-gray-600 font-medium">
           <div className="flex flex-col gap-4">
             <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{t.platform}</span>
             <Link href="/auth/login" className="hover:text-black transition-colors">{t.login}</Link>
             <Link href="/auth/register" className="hover:text-black transition-colors">{t.register}</Link>
           </div>

           <div className="flex flex-col gap-4">
             <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{t.support}</span>
             <Link href="/documentation" className="hover:text-black transition-colors">{t.docs}</Link>
             <Link href="mailto:info@histyon.com" className="hover:text-black transition-colors">{t.contact}</Link>
           </div>

           <div className="flex flex-col gap-4">
             <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{t.legalSection}</span>
             <Link href={`/${lang}/legal/privacy`} className="hover:text-black transition-colors">{tl.privacy}</Link>
             <Link href={`/${lang}/legal/terms`} className="hover:text-black transition-colors">{tl.terms}</Link>
             <Link href={`/${lang}/legal/cookie`} className="hover:text-black transition-colors">{tl.cookie}</Link>
             <Link href={`/${lang}/legal/dpa`} className="hover:text-black transition-colors">{tl.dpa}</Link>
           </div>
        </nav>
      </div>
    </footer>
  )
}