import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getDictionary } from '@/lib/dictionary'
import { 
  ArrowRight, 
  BrainCircuit, 
  ShieldCheck, 
  HardDriveDownload,
  FileJson,
  CheckCircle2
} from 'lucide-react'

export default async function LandingPage() {
  const dict = await getDictionary()

  return (
    <div className="bg-white text-gray-950 font-sans selection:bg-orange-100 selection:text-orange-900 flex flex-col min-h-screen">
      
      <Header variant="public" />

      <main className="flex-1 flex flex-col">
        
        <section className="relative min-h-screen flex flex-col justify-center border-b border-gray-100 pt-20 pb-10">
          <div className="layout-container">
            <div className="max-w-4xl border-l border-gray-950/10 pl-5 md:pl-10 py-8">
              
              <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-gray-950 mb-8 md:mb-10 leading-[0.9] tracking-tight">
                {dict.landing.hero.title1} <br/>
                {dict.landing.hero.title2}
              </h1>

              <div className="flex flex-col md:flex-row gap-8 md:gap-12 md:items-end justify-between">
                <div className="max-w-lg space-y-6">
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
                    {dict.landing.hero.desc}
                  </p>
                  
                  <p className="text-xs sm:text-sm text-gray-400 font-mono flex flex-wrap items-center gap-3 sm:gap-4 uppercase tracking-wider">
                     <span>{dict.landing.hero.badge1}</span>
                     <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                     <span>{dict.landing.hero.badge2}</span>
                     <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                     <span>{dict.landing.hero.badge3}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 shrink-0">
                   <Link 
                    href="/auth/register" 
                    className="group flex items-center gap-3 text-lg font-medium text-gray-950 hover:text-orange-700 transition-colors"
                  >
                    <span className="border-b-2 border-gray-950 group-hover:border-orange-700 pb-0.5 transition-colors">{dict.landing.hero.cta1}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  
                  <Link 
                    href="/documentation" 
                    className="text-lg font-medium text-gray-400 hover:text-gray-950 transition-colors"
                  >
                    {dict.landing.hero.cta2}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="min-h-screen flex items-center py-16 md:py-24 bg-white">
          <div className="layout-container">
            
            <div className="mb-12 md:mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
               <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-gray-900 leading-none">
                 {dict.landing.workflow.title} <br/>
                 <span className="text-gray-300">{dict.landing.workflow.titleColor}</span>
               </h2>
               <p className="text-gray-500 max-w-sm text-left md:text-right font-light leading-relaxed">
                 {dict.landing.workflow.desc}
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-gray-100 border border-gray-100 shadow-sm">
              
              <div className="md:col-span-8 bg-white p-6 md:p-14 min-h-[auto] md:min-h-[400px] flex flex-col justify-between group hover:bg-gray-50/30 transition-colors">
                 <div className="flex justify-between items-start">
                    <HardDriveDownload className="w-8 h-8 text-gray-300 group-hover:text-orange-600 transition-colors" />
                    <span className="text-xs font-mono uppercase tracking-widest text-gray-400">{dict.landing.workflow.f1_label}</span>
                 </div>
                 
                 <div className="max-w-xl mt-8 md:mt-12">
                    <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-gray-900 mb-4 md:mb-6">{dict.landing.workflow.f1_title}</h3>
                    <p className="text-gray-500 font-light leading-relaxed text-base md:text-lg">
                      {dict.landing.workflow.f1_desc}
                    </p>
                 </div>
              </div>

              <div className="md:col-span-4 bg-white p-6 md:p-14 flex flex-col justify-between group hover:bg-gray-50/30 transition-colors">
                 <div className="flex justify-between items-start">
                    <BrainCircuit className="w-8 h-8 text-gray-300 group-hover:text-orange-600 transition-colors" />
                    <span className="text-xs font-mono uppercase tracking-widest text-gray-400">{dict.landing.workflow.f2_label}</span>
                 </div>
                 
                 <div className="mt-8 md:mt-12">
                    <h3 className="font-serif text-xl md:text-2xl text-gray-900 mb-4">{dict.landing.workflow.f2_title}</h3>
                    <p className="text-gray-500 font-light text-sm leading-relaxed mb-6">
                      {dict.landing.workflow.f2_desc}
                    </p>
                    <div className="flex gap-2 opacity-60">
                       <span className="px-2 py-1 bg-gray-50 border border-gray-200 text-[10px] uppercase font-bold text-gray-500 rounded">{dict.landing.workflow.f2_tag1}</span>
                       <span className="px-2 py-1 bg-gray-50 border border-gray-200 text-[10px] uppercase font-bold text-gray-500 rounded">{dict.landing.workflow.f2_tag2}</span>
                    </div>
                 </div>
              </div>

              <div className="md:col-span-4 bg-white p-6 md:p-14 flex flex-col justify-between group hover:bg-gray-50/30 transition-colors">
                 <div className="flex justify-between items-start">
                    <FileJson className="w-8 h-8 text-gray-300 group-hover:text-orange-600 transition-colors" />
                    <span className="text-xs font-mono uppercase tracking-widest text-gray-400">{dict.landing.workflow.f3_label}</span>
                 </div>
                 <div className="mt-8">
                    <h3 className="font-serif text-xl md:text-2xl text-gray-900 mb-4">{dict.landing.workflow.f3_title}</h3>
                    <p className="text-gray-500 font-light text-sm">
                        {dict.landing.workflow.f3_desc}
                    </p>
                 </div>
              </div>

              <div className="md:col-span-8 bg-white p-6 md:p-14 flex flex-col md:flex-row md:items-end justify-between gap-8 group hover:bg-gray-50/30 transition-colors">
                 <div className="max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck className="w-8 h-8 text-gray-300 group-hover:text-orange-600 transition-colors" />
                      <span className="text-xs font-mono uppercase tracking-widest text-gray-400">{dict.landing.workflow.f4_label}</span>
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl text-gray-900 mb-4">{dict.landing.workflow.f4_title}</h3>
                    <p className="text-gray-500 font-light leading-relaxed">
                      {dict.landing.workflow.f4_desc}
                    </p>
                 </div>
                 
                 <div className="hidden md:block">
                    <CheckCircle2 className="w-12 h-12 text-gray-100 group-hover:text-green-500 transition-colors duration-500" />
                 </div>
              </div>

            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 border-t border-gray-100 bg-white">
           <div className="layout-container">
             <div className="flex flex-col items-start md:items-center text-left md:text-center max-w-2xl mx-0 md:mx-auto">
                
                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-gray-900 mb-6 tracking-tight">
                   {dict.landing.cta.title}
                </h2>
                <p className="text-lg text-gray-500 font-light mb-12">
                   {dict.landing.cta.desc}
                </p>

                <Link 
                  href="/auth/register" 
                  className="group inline-flex items-center gap-3 px-8 py-3 border border-gray-950 text-gray-950 text-base font-medium rounded hover:bg-gray-950 hover:text-white transition-all duration-300"
                >
                  <span>{dict.landing.cta.btn}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                
                <p className="mt-10 text-xs text-gray-400 font-mono">
                   {dict.landing.cta.note}
                </p>

             </div>
           </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}