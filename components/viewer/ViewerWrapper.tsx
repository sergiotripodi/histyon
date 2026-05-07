'use client'

import dynamic from 'next/dynamic'

const OpenSeadragonViewer = dynamic(
  () => import('./OpenSeadragonViewer'),
  { ssr: false }
)

export default function ViewerWrapper({ dziUrl, loadingText }: { dziUrl: string; loadingText?: string }) {
  return <OpenSeadragonViewer dziUrl={dziUrl} loadingText={loadingText} />
}