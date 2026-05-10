'use client'

import { Shield, Scale, Cookie, Lock, FileText } from 'lucide-react'

interface LegalContentProps {
  dict: any
  tab: 'privacy' | 'terms' | 'cookie' | 'dpa'
}

export function LegalContent({ dict, tab }: LegalContentProps) {
  const t  = dict.legal
  const tc = dict.legal.content

  return (
    <>
      {/* Hero */}
      <div className="border-b border-gray-100 py-16 bg-white">
        <div className="layout-container px-6 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t.title}</h1>
          <p className="text-base text-gray-500 max-w-2xl">{t.subtitle}</p>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest pt-2">{t.update}</p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 layout-container px-6 py-12 md:py-16">

        {tab === 'privacy' && (
          <div className="space-y-10">
            <SectionTitle title={tc.privacyTitle} subtitle={tc.privacySub} icon={Shield} />
            <TextBlock title={tc.privacy.sec1.title}>{tc.privacy.sec1.body}</TextBlock>
            <TextBlock title={tc.privacy.sec2.title}>{tc.privacy.sec2.body}</TextBlock>
            <TextBlock title={tc.privacy.sec3.title}>{tc.privacy.sec3.body}</TextBlock>
            <TextBlock title={tc.privacy.sec4.title}>{tc.privacy.sec4.body}</TextBlock>
            {tc.privacy.sec5 && (
              <TextBlock title={tc.privacy.sec5.title}>{tc.privacy.sec5.body}</TextBlock>
            )}
          </div>
        )}

        {tab === 'terms' && (
          <div className="space-y-10">
            <SectionTitle title={tc.termsTitle} subtitle={tc.termsSub} icon={Scale} />
            <AlertBox disclaimer={tc.disclaimer} text={tc.disclaimerText} />
            <TextBlock title={tc.terms.sec1.title}>{tc.terms.sec1.body}</TextBlock>
            <TextBlock title={tc.terms.sec2.title}>{tc.terms.sec2.body}</TextBlock>
            <TextBlock title={tc.terms.sec3.title}>{tc.terms.sec3.body}</TextBlock>
            {tc.terms.sec4 && <TextBlock title={tc.terms.sec4.title}>{tc.terms.sec4.body}</TextBlock>}
            {tc.terms.sec5 && <TextBlock title={tc.terms.sec5.title}>{tc.terms.sec5.body}</TextBlock>}
          </div>
        )}

        {tab === 'cookie' && (
          <div className="space-y-10">
            <SectionTitle title={tc.cookieTitle} subtitle={tc.cookieSub} icon={Cookie} />
            <TextBlock title={tc.cookie.sec1.title}>{tc.cookie.sec1.body}</TextBlock>
            <TextBlock title={tc.cookie.sec2.title}>{tc.cookie.sec2.body}</TextBlock>
            <TextBlock title={tc.cookie.sec3.title}>{tc.cookie.sec3.body}</TextBlock>
          </div>
        )}

        {tab === 'dpa' && (
          <div className="space-y-10">
            <SectionTitle title={tc.dpaTitle} subtitle={tc.dpaSub} icon={FileText} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 border border-gray-200 bg-white">
                <Lock className="w-5 h-5 mb-3 text-gray-900" />
                <h3 className="font-bold text-sm mb-2">{tc.dpa.cards.crypto.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{tc.dpa.cards.crypto.body}</p>
              </div>
              <div className="p-6 border border-gray-200 bg-white">
                <Shield className="w-5 h-5 mb-3 text-gray-900" />
                <h3 className="font-bold text-sm mb-2">{tc.dpa.cards.access.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{tc.dpa.cards.access.body}</p>
              </div>
            </div>

            <TextBlock title={tc.dpa.sec1.title}>{tc.dpa.sec1.body}</TextBlock>
            <TextBlock title={tc.dpa.sec2.title}>{tc.dpa.sec2.body}</TextBlock>
          </div>
        )}

      </main>
    </>
  )
}

function SectionTitle({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ElementType }) {
  return (
    <div className="pb-6 border-b border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-gray-900" />
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>
      <p className="text-gray-500 text-base">{subtitle}</p>
    </div>
  )
}

function TextBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
      <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{children}</div>
    </div>
  )
}

function AlertBox({ disclaimer, text }: { disclaimer: string; text: string }) {
  return (
    <div className="border-l-2 border-gray-300 pl-5 py-1">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{disclaimer}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  )
}
