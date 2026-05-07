'use client'

import React, { useEffect, useRef, useState } from 'react'
import OpenSeadragon from 'openseadragon'
import { Plus, Minus, Home, Maximize } from 'lucide-react'
import { isSafeDziSource } from '@/lib/url-security'

interface Props {
  dziUrl: string
  loadingText?: string
}

export default function OpenSeadragonViewer({ dziUrl, loadingText = 'Loading...' }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const osdRef    = useRef<OpenSeadragon.Viewer | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!viewerRef.current || !isSafeDziSource(dziUrl)) return

    osdRef.current = OpenSeadragon({
      element:               viewerRef.current,
      tileSources:           dziUrl,
      prefixUrl:             'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.0.0/images/',
      showNavigationControl: false,
      showNavigator:         true,
      navigatorPosition:     'BOTTOM_RIGHT',
      navigatorAutoFade:     false,
      maxZoomPixelRatio:     4,
      blendTime:             0,
      animationTime:         0.25,
      springStiffness:       12,
      imageLoaderLimit:      8,
      alwaysBlend:           false,
      smoothTileEdgesMinZoom: Infinity,
      timeout:               90000,
    })

    osdRef.current.addHandler('open', () => setIsReady(true))

    return () => {
      if (osdRef.current) osdRef.current.destroy()
    }
  }, [dziUrl])

  const zoomIn     = () => osdRef.current?.viewport.zoomBy(1.5).applyConstraints()
  const zoomOut    = () => osdRef.current?.viewport.zoomBy(1 / 1.5).applyConstraints()
  const goHome     = () => osdRef.current?.viewport.goHome()
  const toggleFull = () => osdRef.current?.setFullPage(!osdRef.current.isFullPage())

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden">
      <div ref={viewerRef} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-6 left-6 flex flex-col gap-1 z-20">
        <Ctrl onClick={zoomIn}     Icon={Plus}     label="Zoom in" />
        <Ctrl onClick={zoomOut}    Icon={Minus}    label="Zoom out" />
        <div className="h-px bg-white/10 my-0.5" />
        <Ctrl onClick={goHome}     Icon={Home}     label="Fit" />
        <Ctrl onClick={toggleFull} Icon={Maximize} label="Fullscreen" />
      </div>

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a] z-30">
          <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
          <p className="text-xs font-medium tracking-widest text-white/40 uppercase">{loadingText}</p>
        </div>
      )}
    </div>
  )
}

function Ctrl({ onClick, Icon, label }: { onClick: () => void; Icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-9 h-9 flex items-center justify-center bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}
