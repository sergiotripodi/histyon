'use client'

import dynamic from 'next/dynamic'
import type { Annotations } from '@/types'

const OpenSeadragonViewer = dynamic(
  () => import('./OpenSeadragonViewer'),
  { ssr: false }
)

interface Props {
  dziUrl:       string
  annotations?: Annotations | null
  loadingText?: string
}

export default function ViewerWrapper({ dziUrl, annotations, loadingText }: Props) {
  return (
    <OpenSeadragonViewer
      dziUrl={dziUrl}
      annotations={annotations}
      loadingText={loadingText}
    />
  )
}
