'use client'

import React, { useEffect, useRef, useState } from 'react'
import OpenSeadragon from 'openseadragon'
import { Plus, Minus, Home, Maximize, RotateCcw } from 'lucide-react'
import { isSafeDziSource } from '@/lib/url-security'

interface Props {
  dziUrl: string
}

export default function OpenSeadragonViewer({ dziUrl }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const osdRef = useRef<OpenSeadragon.Viewer | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!viewerRef.current || !isSafeDziSource(dziUrl)) return

    osdRef.current = OpenSeadragon({
      element: viewerRef.current,
      tileSources: dziUrl,
      prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.0.0/images/",
      showNavigationControl: false, 
      showNavigator: true,
      navigatorPosition: "BOTTOM_RIGHT",
      maxZoomPixelRatio: 1, 
      blendTime: 0, 
      animationTime: 0.3, 
      springStiffness: 15, 
      imageLoaderLimit: 20, 
      alwaysBlend: false,
      smoothTileEdgesMinZoom: Infinity, 
    })

    osdRef.current.addHandler('open', () => setIsReady(true))

    return () => {
      if (osdRef.current) osdRef.current.destroy()
    }
  }, [dziUrl])

  const zoomIn = () => osdRef.current?.viewport.zoomBy(1.2).applyConstraints()
  const zoomOut = () => osdRef.current?.viewport.zoomBy(0.8).applyConstraints()
  const goHome = () => osdRef.current?.viewport.goHome()
  const toggleFull = () => osdRef.current?.setFullPage(!osdRef.current.isFullPage())

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden">
      <div ref={viewerRef} className="w-full h-full" />
      
      <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col gap-2 z-20">
        <div className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex flex-col shadow-2xl">
          <ControlButton onClick={zoomIn} icon={Plus} label="Zoom In" />
          <ControlButton onClick={zoomOut} icon={Minus} label="Zoom Out" />
          <div className="h-[1px] bg-white/10 my-1 mx-2" />
          <ControlButton onClick={goHome} icon={Home} label="Reset" />
          <ControlButton onClick={toggleFull} icon={Maximize} label="Full" />
        </div>
      </div>

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-4 text-white">
            <RotateCcw className="w-8 h-8 animate-spin opacity-50" />
            <p className="text-sm font-bold tracking-widest uppercase opacity-50">Caricamento Tessuti...</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ControlButton({ onClick, icon: Icon, label }: { onClick: () => void, icon: React.ElementType, label: string }) {
  return (
    <button 
      onClick={onClick}
      className="p-3 text-white hover:bg-white/20 rounded-xl transition-all active:scale-90 group relative"
      title={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}