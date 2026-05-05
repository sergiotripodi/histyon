'use client'

import { useState } from 'react'
import { Shield, Scale, Cookie, Lock, FileText } from 'lucide-react'

interface LegalContentProps {
  dict: any
}

export function LegalContent({ dict }: LegalContentProps) {
  const t = dict.legal;
  const tc = dict.legal.content; 
  
  const TABS = [
    { id: 'privacy', label: t.tabs.privacy, icon: Shield },
    { id: 'terms', label: t.tabs.terms, icon: Scale },
    { id: 'cookie', label: t.tabs.cookie, icon: Cookie },
    { id: 'dpa', label: t.tabs.dpa, icon: FileText },
  ]
  
  const [activeTab, setActiveTab] = useState('privacy')

  return (
    <>
      <div className="bg-gray-50 border-b border-gray-200 py-16">
        <div className="w-full max-w-7xl mx-auto px-6 text-left space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-lg text-gray-500 max-w-2xl">{t.subtitle}</p>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest pt-4">{t.update}</p>
        </div>
      </div>

      <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="w-full max-w-7xl mx-auto px-6 overflow-x-auto scrollbar-hide">
           <div className="flex justify-start min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`
                    flex items-center gap-2 px-6 py-5 text-sm font-bold border-b-2 transition-all duration-200 first:pl-0
                    ${activeTab === tab.id 
                      ? 'border-black text-black' 
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'}
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-16 max-w-4xl mx-auto">
        
        {activeTab === 'privacy' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <SectionTitle title={tc.privacyTitle} subtitle={tc.privacySub} />
             
             <TextBlock title={tc.privacy.sec1.title}>
               {tc.privacy.sec1.body}
             </TextBlock>

             <TextBlock title={tc.privacy.sec2.title}>
                {tc.privacy.sec2.body}
             </TextBlock>

             <TextBlock title={tc.privacy.sec3.title}>
                {tc.privacy.sec3.body}
             </TextBlock>

             <TextBlock title={tc.privacy.sec4.title}>
                {tc.privacy.sec4.body}
             </TextBlock>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionTitle title={tc.termsTitle} subtitle={tc.termsSub} />
            
            <AlertBox>
               <strong>{tc.disclaimer}</strong><br/>
               {tc.disclaimerText}
            </AlertBox>

            <TextBlock title={tc.terms.sec1.title}>
               {tc.terms.sec1.body}
            </TextBlock>

            <TextBlock title={tc.terms.sec2.title}>
               {tc.terms.sec2.body}
            </TextBlock>

            <TextBlock title={tc.terms.sec3.title}>
               {tc.terms.sec3.body}
            </TextBlock>
          </div>
        )}

        {activeTab === 'cookie' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionTitle title={tc.cookieTitle} subtitle={tc.cookieSub} />
            
            <TextBlock title={tc.cookie.sec1.title}>
               {tc.cookie.sec1.body}
            </TextBlock>

            <TextBlock title={tc.cookie.sec2.title}>
               {tc.cookie.sec2.body}
            </TextBlock>

            <TextBlock title={tc.cookie.sec3.title}>
               {tc.cookie.sec3.body}
            </TextBlock>
          </div>
        )}

        {activeTab === 'dpa' && (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <SectionTitle title={tc.dpaTitle} subtitle={tc.dpaSub} />
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                   <Lock className="w-6 h-6 mb-3 text-black" />
                   <h3 className="font-bold text-sm mb-2">{tc.dpa.cards.crypto.title}</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">{tc.dpa.cards.crypto.body}</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                   <Shield className="w-6 h-6 mb-3 text-black" />
                   <h3 className="font-bold text-sm mb-2">{tc.dpa.cards.access.title}</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">{tc.dpa.cards.access.body}</p>
                </div>
             </div>

             <TextBlock title={tc.dpa.sec1.title}>
                {tc.dpa.sec1.body}
             </TextBlock>

             <TextBlock title={tc.dpa.sec2.title}>
                {tc.dpa.sec2.body}
             </TextBlock>
           </div>
        )}

      </main>
    </>
  )
}

function SectionTitle({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="border-b border-gray-100 pb-8 mb-8">
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
      <p className="text-gray-500 mt-2 text-lg">{subtitle}</p>
    </div>
  )
}

function TextBlock({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
        {children}
      </div>
    </div>
  )
}

function AlertBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900 text-sm md:text-base leading-relaxed flex gap-4">
       <div className="shrink-0 pt-1">
          <Scale className="w-6 h-6 text-amber-600" />
       </div>
       <div>{children}</div>
    </div>
  )
}