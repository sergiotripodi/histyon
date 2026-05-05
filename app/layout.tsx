import type { Metadata } from "next";
import "./globals.css";
import { getDictionary } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    metadataBase: new URL('https://histyon.com'),
    title: {
      template: dict.metadata.titleTemplate,
      default: dict.metadata.defaultTitle,
    },
    description: dict.metadata.description,
    keywords: dict.metadata.keywords,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://histyon.com',
      title: dict.metadata.openGraph.title,
      description: dict.metadata.openGraph.description,
      siteName: dict.metadata.openGraph.siteName,
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Histyon - Advanced Medical Diagnostics',
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.metadata.openGraph.title,
      description: dict.metadata.openGraph.description,
      images: ['/twitter-image.jpg'],
    },
    icons: {
      icon: '/favicon.png',
      shortcut: '/favicon.png',
      apple: '/apple-touch-icon.png',
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400,300&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}