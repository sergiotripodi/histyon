'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import OpenSeadragon from 'openseadragon'
import { Plus, Minus, Home, Maximize, Layers, Ruler, PenTool, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { isSafeDziSource } from '@/lib/url-security'
import { saveAnnotations } from '@/lib/actions/annotations'
import type { Annotations, AnnotationFeature, AiResults } from '@/types'

interface Props {
  dziUrl: string
  annotations?: Annotations | null
  results?: AiResults | null
  ticketId?: string
  loadingText?: string
}

const CLASS_COLORS: Record<string, string> = {
  glomerulus:           '#34d399',
  sclerosed_glomerulus: '#f87171',
  tubule_proximal:      '#60a5fa',
  tubule_distal:        '#a78bfa',
}
const DEFAULT_COLOR = '#fbbf24'

const CLASS_IT: Record<string, string> = {
  glomerulus:           'Glomerulo',
  sclerosed_glomerulus: 'Glomerulo sclerotico',
  tubule_proximal:      'Tubulo prossimale',
  tubule_distal:        'Tubulo distale',
}

function colorForFeature(feat: AnnotationFeature): string {
  const cls = feat.properties?.class ?? ''
  return CLASS_COLORS[cls] ?? DEFAULT_COLOR
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function polygonPoints(coords: number[][]): string {
  return coords.map(([x, y]) => `${x},${y}`).join(' ')
}

type Tool = 'none' | 'measure' | 'draw'

interface Popover {
  featureIdx: number
  x: number
  y: number
}

interface MeasureState {
  point1: { x: number; y: number } | null
  point2: { x: number; y: number } | null
}

interface DrawState {
  vertices: { x: number; y: number }[]
  closed: boolean
  showForm: boolean
  formClass: string
  formLabel: string
}

export default function OpenSeadragonViewer({
  dziUrl,
  annotations: initialAnnotations,
  results,
  ticketId,
  loadingText = 'Loading...',
}: Props) {
  const viewerRef  = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<SVGSVGElement>(null)
  const osdRef     = useRef<OpenSeadragon.Viewer | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [isReady,          setIsReady]          = useState(false)
  const [svgViewBox,       setSvgViewBox]        = useState('0 0 1 1')
  const [showAnnotations,  setShowAnnotations]   = useState(true)
  const [sidebarOpen,      setSidebarOpen]       = useState(true)
  const [features,         setFeatures]          = useState<AnnotationFeature[]>(initialAnnotations?.features ?? [])
  const [disabledClasses,  setDisabledClasses]   = useState<Set<string>>(new Set())
  const [popover,          setPopover]           = useState<Popover | null>(null)
  const [activeTool,       setActiveTool]        = useState<Tool>('none')
  const [measure,          setMeasure]           = useState<MeasureState>({ point1: null, point2: null })
  const [draw,             setDraw]              = useState<DrawState>({
    vertices: [], closed: false, showForm: false, formClass: 'glomerulus', formLabel: '',
  })
  const [imgSize,          setImgSize]           = useState({ w: 1, h: 1 })

  const hasAnnotations = features.length > 0

  const uniqueClasses = Array.from(
    new Set(features.map(f => f.properties?.class ?? 'unknown').filter(Boolean))
  )

  const syncOverlay = useCallback(() => {
    const viewer = osdRef.current
    if (!viewer || !viewer.world.getItemCount()) return
    const item   = viewer.world.getItemAt(0)
    const bounds = viewer.viewport.getBoundsNoRotate()
    const imgSz  = item.getContentSize()
    const x = bounds.x * imgSz.x
    const y = bounds.y * imgSz.y
    const w = bounds.width  * imgSz.x
    const h = bounds.height * imgSz.y
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
      imageLoaderLimit:      12,
      maxImageCacheCount:    800,
      alwaysBlend:           false,
      smoothTileEdgesMinZoom: Infinity,
      timeout:               90000,
    })

    osdRef.current = viewer

    viewer.addHandler('open', () => {
      setIsReady(true)
      syncOverlay()
      if (viewer.world.getItemCount()) {
        const sz = viewer.world.getItemAt(0).getContentSize()
        setImgSize({ w: sz.x, h: sz.y })
      }
    })
    viewer.addHandler('animation',       syncOverlay)
    viewer.addHandler('viewport-change', syncOverlay)

    return () => {
      viewer.removeAllHandlers('open')
      viewer.removeAllHandlers('animation')
      viewer.removeAllHandlers('viewport-change')
      viewer.removeAllHandlers('canvas-click')
      viewer.removeAllHandlers('canvas-double-click')
      viewer.destroy()
      osdRef.current = null
    }
  }, [dziUrl, syncOverlay])

  const activeToolRef = useRef<Tool>('none')
  const measureRef    = useRef<MeasureState>({ point1: null, point2: null })
  const drawRef       = useRef<DrawState>({ vertices: [], closed: false, showForm: false, formClass: 'glomerulus', formLabel: '' })
  const featuresRef   = useRef<AnnotationFeature[]>(features)

  useEffect(() => { activeToolRef.current = activeTool }, [activeTool])
  useEffect(() => { measureRef.current    = measure    }, [measure])
  useEffect(() => { drawRef.current       = draw       }, [draw])
  useEffect(() => { featuresRef.current   = features   }, [features])

  useEffect(() => {
    const viewer = osdRef.current
    if (!viewer) return

    viewer.removeAllHandlers('canvas-click')
    viewer.removeAllHandlers('canvas-double-click')

    viewer.addHandler('canvas-click', (e: OpenSeadragon.CanvasClickEvent) => {
      if (!e.quick) return
      const tool = activeToolRef.current
      if (tool === 'none') return

      const img = viewer.viewport.viewportToImageCoordinates(e.position)

      if (tool === 'measure') {
        const prev = measureRef.current
        if (!prev.point1) {
          setMeasure({ point1: { x: img.x, y: img.y }, point2: null })
        } else {
          setMeasure({ point1: prev.point1, point2: { x: img.x, y: img.y } })
        }
      }

      if (tool === 'draw') {
        const cur = drawRef.current
        if (cur.showForm) return
        setDraw(prev => ({ ...prev, vertices: [...prev.vertices, { x: img.x, y: img.y }] }))
      }
    })

    viewer.addHandler('canvas-double-click', (e: OpenSeadragon.CanvasDoubleClickEvent) => {
      if (activeToolRef.current !== 'draw') return
      const cur = drawRef.current
      if (cur.showForm || cur.vertices.length < 3) return
      e.preventDefaultAction = true
      setDraw(prev => ({ ...prev, closed: true, showForm: true }))
    })
  }, [isReady])

  useEffect(() => {
    const viewer = osdRef.current
    if (!viewer) return
    viewer.setMouseNavEnabled(activeTool !== 'draw')
  }, [activeTool, isReady])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeTool === 'draw') {
          setDraw({ vertices: [], closed: false, showForm: false, formClass: 'glomerulus', formLabel: '' })
          setActiveTool('none')
        }
        if (activeTool === 'measure') {
          setMeasure({ point1: null, point2: null })
          setActiveTool('none')
        }
        setPopover(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTool])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (popover && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [popover])

  const zoomIn     = () => osdRef.current?.viewport.zoomBy(1.5).applyConstraints()
  const zoomOut    = () => osdRef.current?.viewport.zoomBy(1 / 1.5).applyConstraints()
  const goHome     = () => osdRef.current?.viewport.goHome()
  const toggleFull = () => osdRef.current?.setFullPage(!osdRef.current.isFullPage())

  const toggleTool = (tool: Tool) => {
    if (activeTool === tool) {
      setActiveTool('none')
      setMeasure({ point1: null, point2: null })
      setDraw({ vertices: [], closed: false, showForm: false, formClass: 'glomerulus', formLabel: '' })
    } else {
      setActiveTool(tool)
      setMeasure({ point1: null, point2: null })
      setDraw({ vertices: [], closed: false, showForm: false, formClass: 'glomerulus', formLabel: '' })
      setPopover(null)
    }
  }

  const handleFeatureClick = (idx: number, e: React.MouseEvent) => {
    if (activeTool !== 'none') return
    e.stopPropagation()
    const container = viewerRef.current?.getBoundingClientRect()
    if (!container) return
    setPopover({
      featureIdx: idx,
      x: e.clientX - container.left,
      y: e.clientY - container.top,
    })
  }

  const deleteFeature = async (idx: number) => {
    const next = features.filter((_, i) => i !== idx)
    setFeatures(next)
    setPopover(null)
    if (!ticketId) return
    await saveAnnotations(ticketId, { type: 'FeatureCollection', features: next })
  }

  const saveDrawnPolygon = async () => {
    if (draw.vertices.length < 3) return
    const ring = [...draw.vertices, draw.vertices[0]]
    const newFeat: AnnotationFeature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ring.map(v => [v.x, v.y])],
      },
      properties: {
        class: draw.formClass,
        label: draw.formLabel || undefined,
        confidence: undefined,
      },
    }
    const next = [...features, newFeat]
    setFeatures(next)
    setDraw({ vertices: [], closed: false, showForm: false, formClass: 'glomerulus', formLabel: '' })
    setActiveTool('none')
    if (!ticketId) return
    await saveAnnotations(ticketId, { type: 'FeatureCollection', features: next })
  }

  const measureDistance =
    measure.point1 && measure.point2
      ? Math.sqrt(
          Math.pow(measure.point2.x - measure.point1.x, 2) +
          Math.pow(measure.point2.y - measure.point1.y, 2)
        ).toFixed(1)
      : null

  const visibleFeatures = features.filter(f => {
    const cls = f.properties?.class ?? 'unknown'
    return !disabledClasses.has(cls)
  })

  const toggleClass = (cls: string) => {
    setDisabledClasses(prev => {
      const next = new Set(prev)
      next.has(cls) ? next.delete(cls) : next.add(cls)
      return next
    })
  }

  const popoverFeature = popover !== null ? features[popover.featureIdx] : null
  const p = popoverFeature?.properties

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden">
      <div ref={viewerRef} className="w-full h-full" />

      {isReady && (hasAnnotations || draw.vertices.length > 0 || measure.point1) && showAnnotations && (
        <svg
          ref={overlayRef}
          viewBox={svgViewBox}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          {visibleFeatures.map((feat, i) => {
            const color = colorForFeature(feat)
            const geom  = feat.geometry
            const origIdx = features.indexOf(feat)

            if (geom.type === 'Polygon') {
              const outer = (geom.coordinates as number[][][])[0]
              return (
                <g
                  key={origIdx}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={(e) => handleFeatureClick(origIdx, e as unknown as React.MouseEvent)}
                >
                  <polygon
                    points={polygonPoints(outer)}
                    fill={hexToRgba(color, 0.12)}
                    stroke={color}
                    strokeWidth={4}
                  />
                </g>
              )
            }

            if (geom.type === 'MultiPolygon') {
              const polys = geom.coordinates as unknown as number[][][][]
              return (
                <g
                  key={origIdx}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={(e) => handleFeatureClick(origIdx, e as unknown as React.MouseEvent)}
                >
                  {polys.map((poly, pi) => (
                    <polygon
                      key={pi}
                      points={polygonPoints(poly[0])}
                      fill={hexToRgba(color, 0.12)}
                      stroke={color}
                      strokeWidth={4}
                    />
                  ))}
                </g>
              )
            }

            if (geom.type === 'Point') {
              const [cx, cy] = geom.coordinates as number[]
              return (
                <g
                  key={origIdx}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={(e) => handleFeatureClick(origIdx, e as unknown as React.MouseEvent)}
                >
                  <circle cx={cx} cy={cy} r={24} fill={hexToRgba(color, 0.3)} stroke={color} strokeWidth={4} />
                </g>
              )
            }

            return null
          })}

          {draw.vertices.length > 0 && (
            <g style={{ pointerEvents: 'none' }}>
              {draw.vertices.length >= 2 && (
                <polyline
                  points={draw.vertices.map(v => `${v.x},${v.y}`).join(' ')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  strokeDasharray="12 6"
                />
              )}
              {draw.vertices.map((v, i) => (
                <circle key={i} cx={v.x} cy={v.y} r={12} fill="#fbbf24" stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}

          {measure.point1 && measure.point2 && (
            <g style={{ pointerEvents: 'none' }}>
              <line
                x1={measure.point1.x} y1={measure.point1.y}
                x2={measure.point2.x} y2={measure.point2.y}
                stroke="#f59e0b"
                strokeWidth={3}
              />
              <circle cx={measure.point1.x} cy={measure.point1.y} r={10} fill="#f59e0b" />
              <circle cx={measure.point2.x} cy={measure.point2.y} r={10} fill="#f59e0b" />
              <text
                x={(measure.point1.x + measure.point2.x) / 2}
                y={(measure.point1.y + measure.point2.y) / 2 - 20}
                fill="white"
                fontSize={Math.max(20, imgSize.w * 0.01)}
                textAnchor="middle"
                fontFamily="monospace"
              >
                {measureDistance}px
              </text>
            </g>
          )}

          {measure.point1 && !measure.point2 && (
            <circle cx={measure.point1.x} cy={measure.point1.y} r={10} fill="#f59e0b" style={{ pointerEvents: 'none' }} />
          )}
        </svg>
      )}

      {/* Left controls */}
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
        <div className="h-px bg-white/10 my-0.5" />
        <button
          onClick={() => toggleTool('measure')}
          title="Misura distanza"
          className={`w-9 h-9 flex items-center justify-center border transition-all
            ${activeTool === 'measure'
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              : 'bg-white/8 border-white/10 text-white/40 hover:text-white hover:bg-white/15'
            }`}
        >
          <Ruler className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => toggleTool('draw')}
          title="Disegna poligono"
          className={`w-9 h-9 flex items-center justify-center border transition-all
            ${activeTool === 'draw'
              ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300'
              : 'bg-white/8 border-white/10 text-white/40 hover:text-white hover:bg-white/15'
            }`}
        >
          <PenTool className="w-3.5 h-3.5" />
        </button>
        {activeTool !== 'none' && (
          <button
            onClick={() => toggleTool(activeTool)}
            title="Esci dal tool"
            className="w-9 h-9 flex items-center justify-center bg-white/8 border border-white/10 text-white/40 hover:text-white hover:bg-white/15 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Active tool hint */}
      {activeTool !== 'none' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#0a0a0a]/90 border border-white/10 text-white/60 text-xs font-mono tracking-wide">
          {activeTool === 'measure' && !measure.point1 && 'Clicca per il punto 1'}
          {activeTool === 'measure' && measure.point1 && !measure.point2 && 'Clicca per il punto 2'}
          {activeTool === 'measure' && measure.point1 && measure.point2 && `Distanza: ${measureDistance}px — Clicca per ricominciare`}
          {activeTool === 'draw' && !draw.showForm && `${draw.vertices.length} vertici — Doppio click per chiudere — Esc per annullare`}
          {activeTool === 'draw' && draw.showForm && 'Completa il form e salva'}
        </div>
      )}

      {/* Draw form popover */}
      {draw.showForm && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-64 bg-[#111] border border-white/10 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80 uppercase tracking-widest">Nuova annotazione</span>
            <button onClick={() => {
              setDraw({ vertices: [], closed: false, showForm: false, formClass: 'glomerulus', formLabel: '' })
              setActiveTool('none')
            }} className="text-white/40 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest">Classe</label>
            <select
              value={draw.formClass}
              onChange={e => setDraw(prev => ({ ...prev, formClass: e.target.value }))}
              className="bg-[#0a0a0a] border border-white/10 text-white/80 text-xs px-2 py-1.5 outline-none"
            >
              {Object.entries(CLASS_IT).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
              <option value="other">Altro</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest">Label (opzionale)</label>
            <input
              type="text"
              value={draw.formLabel}
              onChange={e => setDraw(prev => ({ ...prev, formLabel: e.target.value }))}
              placeholder="es. G1"
              className="bg-[#0a0a0a] border border-white/10 text-white/80 text-xs px-2 py-1.5 outline-none placeholder:text-white/20"
            />
          </div>
          <button
            onClick={saveDrawnPolygon}
            className="w-full py-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium tracking-wide hover:bg-emerald-500/30 transition-all"
          >
            Salva
          </button>
        </div>
      )}

      {/* Feature detail popover */}
      {popover && popoverFeature && (
        <div
          ref={popoverRef}
          style={{ left: Math.min(popover.x + 12, (viewerRef.current?.clientWidth ?? 600) - 220), top: Math.min(popover.y + 12, (viewerRef.current?.clientHeight ?? 400) - 300) }}
          className="absolute z-30 w-52 bg-[#111] border border-white/10 p-3 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/80 uppercase tracking-widest">
              {CLASS_IT[p?.class ?? ''] ?? p?.class ?? 'Annotazione'}
            </span>
            <button onClick={() => setPopover(null)} className="text-white/30 hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-[11px]">
            {p?.label && (
              <Row label="Label" value={p.label as string} />
            )}
            {p?.confidence != null && (
              <Row label="Confidence" value={`${((p.confidence as number) * 100).toFixed(0)}%`} />
            )}
            {p?.area != null && (
              <Row label="Area" value={`${(p.area as number).toLocaleString()} px²`} />
            )}
            {p?.perimeter != null && (
              <Row label="Perimetro" value={`${(p.perimeter as number).toFixed(0)} px`} />
            )}
            {Boolean(p?.banff) && typeof p?.banff === 'string' && (
              <Row label="Banff" value={p.banff} />
            )}
          </div>

          <div
            className="w-full h-px mt-1"
            style={{ backgroundColor: hexToRgba(colorForFeature(popoverFeature), 0.4) }}
          />

          <button
            onClick={() => deleteFeature(popover.featureIdx)}
            className="w-full py-1 text-[10px] text-red-400/80 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 transition-all"
          >
            Elimina
          </button>
        </div>
      )}

      {/* Right sidebar */}
      <div className={`absolute top-0 right-0 h-full z-20 flex transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        {sidebarOpen && (
          <div className="w-64 h-full bg-[#0d0d0d]/95 border-l border-white/8 flex flex-col overflow-y-auto">
            {results?.summary && (
              <div className="p-4 border-b border-white/8 flex flex-col gap-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Risultati AI</span>

                {results.summary.percentuale_tessuto_malato != null && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Tessuto patologico</span>
                      <span className="text-white/80 font-mono">{results.summary.percentuale_tessuto_malato.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400/70 rounded-full transition-all"
                        style={{ width: `${Math.min(results.summary.percentuale_tessuto_malato, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {results.summary.counts && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <CountCard label="Glomeruli" value={results.summary.counts.glomeruli} color="#34d399" />
                    <CountCard label="Sclerotici" value={results.summary.counts.glomeruli_sclerotici} color="#f87171" />
                    <CountCard label="Tub. pross." value={results.summary.counts.tubuli_prossimali} color="#60a5fa" />
                    <CountCard label="Tub. dist." value={results.summary.counts.tubuli_distali} color="#a78bfa" />
                  </div>
                )}
              </div>
            )}

            {uniqueClasses.length > 0 && (
              <div className="p-4 flex flex-col gap-3">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Filtri</span>
                {uniqueClasses.map(cls => {
                  const count   = features.filter(f => (f.properties?.class ?? 'unknown') === cls).length
                  const color   = CLASS_COLORS[cls] ?? DEFAULT_COLOR
                  const enabled = !disabledClasses.has(cls)
                  return (
                    <button
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`flex items-center gap-2 text-left transition-all ${enabled ? '' : 'opacity-40'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="flex-1 text-xs text-white/70 truncate">{CLASS_IT[cls] ?? cls}</span>
                      <span className="text-[10px] font-mono text-white/30">{count}</span>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all
                        ${enabled ? 'border-white/30 bg-white/10' : 'border-white/10 bg-transparent'}`}
                      >
                        {enabled && <span className="w-1.5 h-1.5 bg-white/70 rounded-sm" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="absolute top-1/2 -translate-y-1/2 -left-7 w-7 h-12 bg-[#0d0d0d]/80 border border-white/8 border-r-0 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/30">{label}</span>
      <span className="text-white/70 font-mono">{value}</span>
    </div>
  )
}

function CountCard({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <div className="bg-white/4 border border-white/6 px-2.5 py-2 flex flex-col gap-0.5">
      <span className="text-[9px] text-white/40 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-mono font-medium" style={{ color }}>{value ?? '—'}</span>
    </div>
  )
}
