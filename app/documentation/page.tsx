import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Metadata } from 'next'
import { DocContent } from './DocContent'

export const metadata: Metadata = {
  title: 'Documentazione | Histyon',
}

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      <Header variant="public" />
      <DocContent />
      <Footer />
    </div>
  )
}
