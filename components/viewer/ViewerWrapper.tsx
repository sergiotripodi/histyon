'use client'

import dynamic from 'next/dynamic'
import type { Annotations, AiResults } from '@/types'

const OpenSeadragonViewer = dynamic(
  () => import('./OpenSeadragonViewer'),
  { ssr: false }
)

interface Props {
  dziUrl:       string
  annotations?: Annotations | null
  results?:     AiResults | null
  ticketId?:    string
  loadingText?: string
}

export default function ViewerWrapper({ dziUrl, annotations, results, ticketId, loadingText }: Props) {
  return (
    <OpenSeadragonViewer
      dziUrl={dziUrl}
      annotations={annotations}
      results={results}
      ticketId={ticketId}
      loadingText={loadingText}
    />
  )
}
