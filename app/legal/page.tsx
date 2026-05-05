import { LegalContent } from '@/components/legal/LegalContent'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getDictionary } from '@/lib/dictionary'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary()
  return {
    title: dict.legal.title,
  }
}

export default async function LegalPage() {
  const dict = await getDictionary()

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">

      <Header variant="public" />
      
      <LegalContent dict={dict} />
      
      <Footer />
    </div>
  )
}