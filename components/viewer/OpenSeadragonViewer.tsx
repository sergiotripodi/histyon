'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import OpenSeadragon from 'openseadragon'
import { Plus, Minus, Home, Maximize, Layers } from 'lucide-react'
import { isSafeDziSource } from '@/lib/url-security'
import type { Annotations, AnnotationFeature } from '@/types'

interface Props {
  dziUrl:       string
  annotations?: Annotations | null
  loadingText?: string
}

// ─── Conversione coordinate GeoJSON → SVG viewBox ────────────────────────────
// Le coordinate GeoJSON delle annotazioni AI usano il sistema pixel dell'immagine
// (origine top-left, asse Y verso il basso). L'overlay SVG usa lo stesso sistema.

function polygonPoints(coords: number[][]): string {
  return coords.map(([x, y]) => `${x},${y}`).join(' ')
}

function renderFeature(feat: AnnotationFeature, idx: number) {
  const geom  = feat.geometry
  const label = feat.properties?.label ?? feat.properties?.class ?? ''
  const conf  = feat.properties?.confidence

  const title = [label, conf != null ? `${(conf * 100).toFixed(0)}%` : ''].filter(Boolean).join(' · ')

  if (geom.type === 'Polygon') {
    const outer = geom.coordinates as number[][][]
    return (
      <g key={idx} className="annotation-feature">
        {title && <title>{title}</title>}
        <polygon
          points={polygonPoints(outer[0])}
          fill="rgba(52,211,153,0.12)"
          stroke="#34d399"
          strokeWidth={4}
        />
      </g>
    )
  }

  if (geom.type === 'MultiPolygon') {
    const polys = geom.coordinates as number[][][][]
    return (
      <g key={idx} className="annotation-feature">
        {title && <title>{title}</title>}
        {polys.map((poly, pi) => (
          <polygon
            key={pi}
            points={polygonPoints(poly[0])}
            fill="rgba(52,211,153,0.12)"
            stroke="#34d399"
            strokeWidth={4}
          />
        ))}
      </g>
    )
  }

  return null
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OpenSeadragonViewer({ dziUrl, annotations, loadingText = 'Loading...' }: Props) {
  const viewerRef  = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<SVGSVGElement>(null)
  const osdRef     = useRef<OpenSeadragon.Viewer | null>(null)

  const [isReady,        setIsReady]        = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [svgViewBox,     setSvgViewBox]     = useState('0 0 1 1')

  const hasAnnotations = !!(annotations?.features?.length)

  // Aggiorna il viewBox SVG al variare del viewport OSD
  const syncOverlay = useCallback(() => {
    const viewer = osdRef.current
    if (!viewer || !viewer.world.getItemCount()) return

    const item   = viewer.world.getItemAt(0)
    const bounds = viewer.viewport.getBoundsNoRotate()
    const imgSz  = item.getContentSize()

    // viewBox in coordinate pixel dell'immagine originale
    const x  = bounds.x * imgSz.x
    const y  = bounds.y * imgSz.y
    const w  = bounds.width  * imgSz.x
    const h  = bounds.height * imgSz.y

    setSvgViewBox(`${x} ${y} ${w} ${h}`)
  }, [])

  useEffect(() => {
    if (!viewerRef.current || !isSafeDziSource(dziUrl)) return

    const viewer = OpenSeadragon({
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
      imageLoaderLimit:      12,   // tile parallele (proxy è leggero, più è meglio)
      maxImageCacheCount:    800,  // OSD non ri-richiede tile già viste
      alwaysBlend:           false,
      smoothTileEdgesMinZoom: Infinity,
      timeout:               90000,
    })

    osdRef.current = viewer

    viewer.addHandler('open',       () => { setIsReady(true); syncOverlay() })
    viewer.addHandler('animation',  syncOverlay)
    viewer.addHandler('viewport-change', syncOverlay)

    return () => {
      viewer.removeAllHandlers('open')
      viewer.removeAllHandlers('animation')
      viewer.removeAllHandlers('viewport-change')
      viewer.destroy()
      osdRef.current = null
    }
  }, [dziUrl, syncOverlay])

  const zoomIn     = () => osdRef.current?.viewport.zoomBy(1.5).applyConstraints()
  const zoomOut    = () => osdRef.current?.viewport.zoomBy(1 / 1.5).applyConstraints()
  const goHome     = () => osdRef.current?.viewport.goHome()
  const toggleFull = () => osdRef.current?.setFullPage(!osdRef.current.isFullPage())

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden">
      {/* Tile canvas OSD */}
      <div ref={viewerRef} className="w-full h-full" />

      {/* Overlay SVG annotazioni — sincronizzato con il viewport OSD */}
      {isReady && hasAnnotations && showAnnotations && (
        <svg
          ref={overlayRef}
          viewBox={svgViewBox}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          {annotations!.features.map((feat, i) => renderFeature(feat, i))}
        </svg>
      )}

      {/* Controlli zoom */}
      <div className="absolute top-6 left-6 flex flex-col gap-1 z-20">
        <Ctrl onClick={zoomIn}     Icon={Plus}     label="Zoom in" />
        <Ctrl onClick={zoomOut}    Icon={Minus}    label="Zoom out" />
        <div className="h-px bg-white/10 my-0.5" />
        <Ctrl onClick={goHome}     Icon={Home}     label="Fit" />
        <Ctrl onClick={toggleFull} Icon={Maximize} label="Fullscreen" />
        {hasAnnotations && (
          <>
            <div className="h-px bg-white/10 my-0.5" />
            <button
              onClick={() => setShowAnnotations(v => !v)}
              title={showAnnotations ? 'Nascondi annotazioni' : 'Mostra annotazioni'}
              className={`w-9 h-9 flex items-center justify-center border transition-all
                ${showAnnotations
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-white/8 border-white/10 text-white/40'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </>
        )}
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
