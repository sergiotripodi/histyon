'use client'

import dynamic from 'next/dynamic'

const OpenSeadragonViewer = dynamic(
  () => import('./OpenSeadragonViewer'),
  { ssr: false }
)

export default function ViewerWrapper({ dziUrl }: { dziUrl: string }) {
  return <OpenSeadragonViewer dziUrl={dziUrl} />
}